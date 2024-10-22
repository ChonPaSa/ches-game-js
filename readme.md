# Chess Game JS

### Express Server
Uses **Express.js** to handle HTTP requests and manage game logic.

### EJS Views
Uses **EJS** to render HTML views.

### Modules
- **MoveControl**: Manages move operations and game control.
- **Socket**: Handles communication via Socket.io.

### Socket.io
- Enables bidirectional real-time communication between server and clients.
- Uses rooms for game-specific messages.

### Database
- **MongoDB** with **Mongoose** to manage users.
- User registration and login are secured with **bcrypt** for password hashing.

### Limitations
- En Passant is not supported.
- Draws by repetition and the 50-move rule are not implemented.
