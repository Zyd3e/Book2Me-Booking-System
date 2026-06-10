import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  setAuth: (user, token) => set({ user, token, isAuthenticated: !!token }),
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  initialize: () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      set({ 
        token, 
        user: JSON.parse(user), 
        isAuthenticated: true 
      });
    }
  },
}));

export const useBookingStore = create((set) => ({
  roomBookings: [],
  hallBookings: [],
  selectedRoom: null,
  selectedHall: null,
  
  setRoomBookings: (bookings) => set({ roomBookings: bookings }),
  setHallBookings: (bookings) => set({ hallBookings: bookings }),
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  setSelectedHall: (hall) => set({ selectedHall: hall }),
}));
