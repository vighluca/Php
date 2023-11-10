import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userData, setUserData] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [socket, setSocket] = useState(null);
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('newComment', (data) => {
      setComments((prevComments) => [...prevComments, data]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleRegister = async () => {
    try {
      const response = await axios.post('http://localhost:3000/register', {
        username,
        password,
      });

      console.log(response.data.message);
    } catch (error) {
      console.error('Registration failed:', error.message);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3000/login', {
        username,
        password,
      });

      console.log(response.data.message);
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };

  const handleGetUserData = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/user/${username}`);
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error.message);
    }
  };

  const handleGetComments = async () => {
    try {
      const response = await axios.get('http://localhost:3000/comments');
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error.message);
    }
  };

  const handleSaveComment = async () => {
    try {
      await axios.post('http://localhost:3000/comments', {
        username,
        comment,
      });
      setComment('');
      socket.emit('newComment', { username, comment });
    } catch (error) {
      console.error('Error saving comment:', error.message);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('username', username);
      formData.append('type', selectedFile.type.split('/')[0]);

      await axios.post('http://localhost:3000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload successful');
    } catch (error) {
      console.error('Upload failed:', error.message);
    }
  };

  const handleToggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  const themeStyle = {
    background: darkTheme ? 'black' : 'white',
    color: darkTheme ? 'red' : 'black',
  };

  return (
    <div style={themeStyle}>
      <h1>My App</h1>
      <div>
        <label>
          Felhasználónév:
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Jelszó:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button onClick={handleRegister}>Regisztráció</button>
        <button onClick={handleLogin}>Bejelentkezés</button>
      </div>
      {userData && (
        <div>
          <h2>{userData.username}</h2>
          {/* Additional user data display here */}
        </div>
      )}
      <div>
        <h2>Vélemények</h2>
        <ul>
          {comments.map((c, index) => (
            <li key={index}>{`${c.username}: ${c.comment}`}</li>
          ))}
        </ul>
        <label>
          Új vélemény:
          <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        <button onClick={handleSaveComment}>Mentés</button>
      </div>
      <div>
        <h2>Feltöltés</h2>
        <label>
          Fájl kiválasztása:
          <input type="file" onChange={handleFileChange} />
        </label>
        <button onClick={handleUpload}>Feltöltés</button>
      </div>
      <button onClick={handleToggleTheme}>Téma váltása</button>
    </div>
  );
}

export default App;
