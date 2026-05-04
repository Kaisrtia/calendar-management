import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, CheckCircle2, AlertCircle, Plus, LogIn, Clock, LogOut } from 'lucide-react';
import { format, addHours, startOfHour } from 'date-fns';

const API_URL = 'http://localhost:3000/api';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Login / Auth State
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Schedule state
  const [schedule, setSchedule] = useState({ appointments: [], groupMeetings: [] });

  const [formData, setFormData] = useState({
    name: '', location: '',
    startTime: format(startOfHour(addHours(new Date(), 1)), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(startOfHour(addHours(new Date(), 2)), "yyyy-MM-dd'T'HH:mm"),
    isGroupMeeting: false
  });

  const [conflictData, setConflictData] = useState(null);
  const [groupMatchData, setGroupMatchData] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch users on mount
  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then(r => r.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Error fetching users:", err));
  }, []);

  // Fetch schedule when user logs in
  const fetchSchedule = (userId) => {
    fetch(`${API_URL}/users/${userId}/schedule`)
      .then(r => r.json())
      .then(data => setSchedule(data))
      .catch(err => console.error("Error fetching schedule", err));
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    fetchSchedule(user.userId);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSchedule({ appointments: [], groupMeetings: [] });
  };

  const resetForm = () => {
    setFormData({
      name: '', location: '',
      startTime: format(startOfHour(addHours(new Date(), 1)), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(startOfHour(addHours(new Date(), 2)), "yyyy-MM-dd'T'HH:mm"),
      isGroupMeeting: false
    });
    setStep(1); setConflictData(null); setGroupMatchData(null); setSuccessMessage('');
  };

  const handleOpenModal = () => {
    resetForm(); setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);

    try {
      const conflictRes = await fetch(`${API_URL}/appointments/check-conflict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId, startTime: new Date(formData.startTime).toISOString(), endTime: new Date(formData.endTime).toISOString() })
      }).then(r => r.json());

      if (conflictRes.conflict) {
        setConflictData(conflictRes.conflict); setStep('CONFLICT'); setLoading(false); return;
      }

      const matchRes = await fetch(`${API_URL}/appointments/match-group-meeting`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData, userId: currentUser.userId, startTime: new Date(formData.startTime).toISOString(), endTime: new Date(formData.endTime).toISOString()
        })
      }).then(r => r.json());

      if (matchRes.matchedGroupMeeting) {
        setGroupMatchData(matchRes.matchedGroupMeeting); setStep('GROUP_MATCH'); setLoading(false); return;
      } else if (matchRes.message === "Added successfully") {
        setSuccessMessage('Appointment successfully scheduled!'); 
        setStep('SUCCESS');
        fetchSchedule(currentUser.userId);
        setLoading(false);
        return;
      }

      await createFinalAppointment();
    } catch (err) {
      alert("Error connecting to server"); setLoading(false);
    }
  };

  const createFinalAppointment = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/appointments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData, userId: currentUser.userId, startTime: new Date(formData.startTime).toISOString(), endTime: new Date(formData.endTime).toISOString()
        })
      });
      setSuccessMessage('Appointment successfully scheduled!'); 
      setStep('SUCCESS');
      fetchSchedule(currentUser.userId); // refresh view
    } catch (err) {
      alert("Error creating appointment");
    } finally { setLoading(false); }
  };

  const handleResolveConflict = async (action) => {
    if (action === 'REPLACE') {
      setLoading(true);
      try {
        await fetch(`${API_URL}/appointments/replace-conflict`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conflictApptId: conflictData.id })
        });
        
        const matchRes = await fetch(`${API_URL}/appointments/match-group-meeting`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData, userId: currentUser.userId, startTime: new Date(formData.startTime).toISOString(), endTime: new Date(formData.endTime).toISOString()
          })
        }).then(r => r.json());

        if (matchRes.matchedGroupMeeting) {
          setGroupMatchData(matchRes.matchedGroupMeeting); setStep('GROUP_MATCH');
        } else if (matchRes.message === "Added successfully") {
          setSuccessMessage('Appointment successfully scheduled!'); 
          setStep('SUCCESS');
          fetchSchedule(currentUser.userId);
        } else {
          await createFinalAppointment();
        }
      } catch (err) { alert("Error resolving conflict"); } finally { setLoading(false); }
    } else { setStep(1); setConflictData(null); }
  };

  const handleJoinGroup = async (action) => {
    setLoading(true);
    try {
      if (action === 'YES') {
        await fetch(`${API_URL}/appointments/join-group`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId: groupMatchData.id, userId: currentUser.userId })
        });
        setSuccessMessage(`Successfully joined the group meeting: ${groupMatchData.appointment?.name}`); 
        setStep('SUCCESS');
        fetchSchedule(currentUser.userId); // refresh view
      } else { await createFinalAppointment(); }
    } catch (err) { alert("Error"); } finally { setLoading(false); }
  };

  // --- LOGIN PAGE ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Welcome Back</h2>
          <p className="text-slate-500 mb-8">Select a user account to simulate logging in and start scheduling your events.</p>
          
          <div className="space-y-3">
            {users.length === 0 && <p className="text-sm text-slate-400">Loading users...</p>}
            {users.map(u => (
              <button 
                key={u.userId} 
                onClick={() => handleLogin(u)}
                className="w-full flex items-center justify-between bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 py-3.5 px-5 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {u.name.charAt(0)}
                  </div>
                  <span className="font-semibold">{u.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8 font-sans text-slate-800">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-lg font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-bold text-xl">{currentUser.name}</h1>
            <p className="text-sm text-slate-500">My Calendar View</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </header>

      <div className="relative z-10 max-w-6xl w-full mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Schedule */}
        <div className="md:w-5/12 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-[700px]">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800">
            <Clock className="w-5 h-5 text-indigo-500"/> Upcoming Schedule
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 rounded-xl">
            {schedule.appointments.length === 0 && schedule.groupMeetings.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No events scheduled.</p>
              </div>
            )}

            {/* Render Appointments */}
            {schedule.appointments.map(apt => (
              <div key={apt.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800">{apt.name}</h3>
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Appt</span>
                </div>
                <div className="text-sm text-slate-500 space-y-1">
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> {apt.location}</p>
                  <p className="flex items-center gap-1.5 min-w-0 truncate">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0"/> 
                    {new Date(apt.startTime).toLocaleString()} - {new Date(apt.endTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Render Group Meetings */}
            {schedule.groupMeetings.map(gm => (
              <div key={gm.id} className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-indigo-900">{gm.appointment.name}</h3>
                  <span className="text-xs font-semibold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Users className="w-3 h-3"/> Group
                  </span>
                </div>
                <div className="text-sm text-indigo-600 space-y-1">
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> {gm.appointment.location}</p>
                  <p className="flex items-center gap-1.5 min-w-0 truncate">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0"/> 
                    {new Date(gm.appointment.startTime).toLocaleString()} - {new Date(gm.appointment.endTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={handleOpenModal} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Schedule New Event
          </button>
        </div>

        {/* Right Side: Action Area */}
        <div className="flex-1 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center justify-center h-[700px]">
          {!isModalOpen ? (
            <div className="text-center text-slate-400">
               <Calendar className="w-20 h-20 mx-auto mb-4 opacity-10 text-indigo-900" />
               <h3 className="text-lg font-medium text-slate-600 mb-2">Your Calendar is Ready</h3>
               <p>Click "Schedule New Event" to add an appointment or join a group meeting.</p>
            </div>
          ) : (
            <div className="w-full max-w-md animate-in fade-in duration-300">
              
              {step === 1 && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Schedule Event</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Event Name</label>
                      <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="E.g., Design Sync" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Location</label>
                      <div className="relative">
                        <MapPin className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                        <input type="text" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Zoom link or Room" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Start Time</label>
                        <input type="datetime-local" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">End Time</label>
                        <input type="datetime-local" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                       <input type="checkbox" id="isGroupMeeting" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300" checked={formData.isGroupMeeting} onChange={e => setFormData({...formData, isGroupMeeting: e.target.checked})} />
                       <label htmlFor="isGroupMeeting" className="text-sm font-medium text-slate-700">Make this a Group Meeting (Allows others to join)</label>
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors">Cancel</button>
                    <button type="submit" disabled={loading} className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-black transition-colors disabled:opacity-50">{loading ? 'Checking...' : 'Continue'}</button>
                  </div>
                </form>
              )}

              {step === 'CONFLICT' && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto"><AlertCircle className="w-8 h-8" /></div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Time Conflict</h2>
                    <p className="text-slate-500">You already have an event scheduled running during this time: <br/><strong className="text-slate-800 border-b border-red-200 pb-0.5">{conflictData?.name}</strong></p>
                  </div>
                  <div className="flex flex-col gap-3 pt-4">
                    <button onClick={() => handleResolveConflict('REPLACE')} className="w-full py-3.5 px-4 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors border border-red-200">Replace Existing Event</button>
                    <button onClick={() => handleResolveConflict('CHANGE')} className="w-full py-3.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors">Choose Another Time</button>
                  </div>
                </div>
              )}

              {step === 'GROUP_MATCH' && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto"><Users className="w-8 h-8" /></div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Group Meeting Found</h2>
                    <p className="text-slate-500">A group meeting named <strong className="text-slate-800">{groupMatchData?.appointment?.name}</strong> exactly matching your duration exists. Would you like to join it instead?</p>
                  </div>
                  <div className="flex flex-col gap-3 pt-4">
                    <button onClick={() => handleJoinGroup('YES')} className="w-full py-3.5 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200/50">Yes, Join Group</button>
                    <button onClick={() => handleJoinGroup('NO')} className="w-full py-3.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors">No, Keep My Appointment</button>
                  </div>
                </div>
              )}

              {step === 'SUCCESS' && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8" /></div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Success!</h2>
                    <p className="text-slate-500">{successMessage}</p>
                  </div>
                  <div className="pt-4">
                    <button onClick={() => setIsModalOpen(false)} className="w-full py-3.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors">Close</button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
