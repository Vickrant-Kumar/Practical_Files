const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// In-memory seat data
// Example: 5 rows, 5 seats each (A1, A2, ..., E5)
const seats = {};
const rows = ['A', 'B', 'C', 'D', 'E'];
const cols = [1, 2, 3, 4, 5];

rows.forEach(row => {
    cols.forEach(col => {
        const seatId = `${row}${col}`;
        seats[seatId] = {
            status: 'available', // 'available', 'locked', 'booked'
            lockedBy: null,
            lockTimeout: null
        };
    });
});

// Helper to unlock a seat after timeout
function unlockSeat(seatId) {
    if (seats[seatId].status === 'locked') {
        seats[seatId].status = 'available';
        seats[seatId].lockedBy = null;
        seats[seatId].lockTimeout = null;
        console.log(`Seat ${seatId} lock expired.`);
    }
}

// GET available seats
app.get('/seats', (req, res) => {
    const seatList = Object.entries(seats).map(([id, data]) => ({
        id,
        status: data.status
    }));
    res.json(seatList);
});

// POST lock a seat
app.post('/lock', (req, res) => {
    const { seatId, user } = req.body;
    if (!seatId || !user || !seats[seatId]) {
        return res.status(400).json({ message: 'Invalid seat or user' });
    }

    const seat = seats[seatId];

    if (seat.status === 'booked') {
        return res.status(400).json({ message: 'Seat already booked' });
    }
    if (seat.status === 'locked') {
        return res.status(400).json({ message: `Seat locked by ${seat.lockedBy}` });
    }

    seat.status = 'locked';
    seat.lockedBy = user;
    seat.lockTimeout = setTimeout(() => unlockSeat(seatId), 60000); // 1 min lock
    res.json({ message: `Seat ${seatId} locked for ${user} for 1 minute` });
});

// POST confirm booking
app.post('/confirm', (req, res) => {
    const { seatId, user } = req.body;
    if (!seatId || !user || !seats[seatId]) {
        return res.status(400).json({ message: 'Invalid seat or user' });
    }

    const seat = seats[seatId];

    if (seat.status !== 'locked' || seat.lockedBy !== user) {
        return res.status(400).json({ message: 'Seat not locked by you or already booked' });
    }

    clearTimeout(seat.lockTimeout);
    seat.status = 'booked';
    seat.lockedBy = null;
    seat.lockTimeout = null;
    res.json({ message: `Seat ${seatId} successfully booked by ${user}` });
});

// Start server
app.listen(port, () => {
    console.log(`Ticket Booking System running at http://localhost:${port}`);
});
