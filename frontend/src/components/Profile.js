import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getMyTasks, getMyConnections } from '../services/JobService';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile
        const userData = await getCurrentUser();
        if (!userData) {
          navigate('/login');
          return;
        }
        setUser(userData);

        // Fetch tasks and connections
        const [tasksData, connectionsData] = await Promise.all([
          getMyTasks(),
          getMyConnections()
        ]);
        
        setMyTasks(tasksData || []);
        setMyConnections(connectionsData || []);
        
      } catch (err) {
        setError('Failed to load profile data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) return <div className="container">Loading profile...</div>;
  if (error) return <div className="container alert alert-danger">{error}</div>;
  if (!user) return <div className="container">Please login to view your profile.</div>;

  const renderProfileTab = () => (
    <div className="profile-info">
      <h2>Personal Information</h2>
      <div className="profile-details">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Phone:</strong> {user.phoneNumber}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Location:</strong> {user.location?.village}, {user.location?.subCounty}, {user.location?.county}</p>
        
        {user.role === 'tasker' && (
          <>
            <h3>Skills</h3>
            {user.skills && user.skills.length > 0 ? (
              <ul>
                {user.skills.map((skill, index) => (
                  <li key={index}>{skill.name || skill}</li>
                ))}
              </ul>
            ) : (
              <p>No skills added yet.</p>
            )}
            
            <h3>Average Rating</h3>
            <p>{user.averageRating ? `${user.averageRating} / 5` : 'No ratings yet'}</p>
          </>
        )}
        
        {user.role === 'employer' && (
          <>
            <h3>Wallet Balance</h3>
            <p>KSH {user.wallet?.balance || 0}</p>
          </>
        )}
      </div>
    </div>
  );

  const renderTasksTab = () => (
    <div className="my-tasks">
      <h2>My {user.role === 'employer' ? 'Posted' : 'Assigned'} Tasks</h2>
      {myTasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <div className="job-list">
          {myTasks.map(task => (
            <div key={task._id} className="job-card">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <div className="job-details">
                <p><strong>Location:</strong> {task.location.village}</p>
                <p><strong>Payment:</strong> KSH {task.payment.amount}</p>
                <p><strong>Status:</strong> <span className={`status status-${task.status}`}>{task.status}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderConnectionsTab = () => (
    <div className="my-connections">
      <h2>My Connections</h2>
      {myConnections.length === 0 ? (
        <p>No connections yet.</p>
      ) : (
        <div className="connection-list">
          {myConnections.map(connection => (
            <div key={connection._id} className="job-card">
              <h3>{connection.task?.title || 'Unnamed Task'}</h3>
              <div className="job-details">
                <p><strong>Connected with:</strong> {user.role === 'employer' ? connection.tasker?.name : connection.employer?.name}</p>
                <p><strong>Status:</strong> <span className={`status status-${connection.status}`}>{connection.status}</span></p>
                {connection.startDate && (
                  <p><strong>Started:</strong> {new Date(connection.startDate).toLocaleDateString()}</p>
                )}
                {connection.endDate && (
                  <p><strong>Completed:</strong> {new Date(connection.endDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container">
      <h1>My Profile</h1>
      
      <div className="profile-tabs">
        <button 
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Info
        </button>
        <button 
          className={`btn ${activeTab === 'tasks' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          My Tasks
        </button>
        <button 
          className={`btn ${activeTab === 'connections' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          Connections
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'tasks' && renderTasksTab()}
        {activeTab === 'connections' && renderConnectionsTab()}
      </div>
    </div>
  );
};

export default Profile;