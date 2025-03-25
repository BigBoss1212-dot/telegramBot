import React, { useEffect, useState } from "react";
// import axios from "axios";

const App = () => {
    const [users, setUsers] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5000/api/users")
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error("Error fetching users:", err));
    }, []);

    const handleRowClick = async (data) => {
        setSelectedImage(data);
    };

    const closeModal = () => {
        setSelectedImage(null)
    }


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
                        <th>PaymentMethod</th>
                        <th>Image</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.chatId} onClick={() => handleRowClick(user.imageUrl)}>
                            <td>{user.chatId}</td>
                            <td>{user.firstName || "N/A"}</td>
                            <td>{user.lastName || "N/A"}</td>
                            <td>{user.email || "N/A"}</td>
                            <td>{user.paymentMethod || "N/A"}</td>
                            <td>
                                {user.imageUrl ? (
                                    <img src={user.imageUrl} alt="User" width="50" />
                                ) : "No Image"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {selectedImage && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center"
                }} onClick={closeModal}>
                    <div style={{
                        background: "#fff", padding: "20px", borderRadius: "10px", textAlign: "center",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", position: "relative"
                    }}>
                        <span onClick={closeModal} style={{
                            position: "absolute", top: "10px", right: "15px", fontSize: "20px",
                            cursor: "pointer", color: "#333"
                        }}>✖</span>
                        <h3>Check!!!</h3>
                        <img src={selectedImage} alt="User" style={{ width: "300px", borderRadius: "10px" }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
