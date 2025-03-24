import React, { useEffect, useState } from "react";
import axios from "axios";

const App = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/api/users")
            .then(response => {
                setUsers(response.data);
            })
            .catch(error => {
                console.error("Error fetching users:", error);
            });
    }, []);

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h2>User List</h2>
            <table border="1" cellPadding="10" cellSpacing="0">
                <thead>
                    <tr>
                        <th>Chat ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Image</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.chatId}>
                            <td>{user.chatId}</td>
                            <td>{user.firstName || "N/A"}</td>
                            <td>{user.lastName || "N/A"}</td>
                            <td>{user.email || "N/A"}</td>
                            <td>
                                {user.imageUrl ? (
                                    <img src={user.imageUrl} alt="User" width="50" />
                                ) : "No Image"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default App;
