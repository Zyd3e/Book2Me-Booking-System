import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';

export default function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });

  const handleBookRooms = () => {
    if (!isAuthenticated) {
      setModalContent({
        title: 'Please Sign In',
        message: 'You need to register or login before booking. Would you like to go to the login page now?'
      });
      setModalOpen(true);
      return;
    }

    if (user?.role !== 'customer') {
      setModalContent({
        title: 'Customer Account Required',
        message: 'Bookings are only available to customers. Would you like to login with a customer account?'
      });
      setModalOpen(true);
      return;
    }

    navigate('/customer/rooms');
  };

  const modalActions = [
    { label: 'Cancel', onClick: () => setModalOpen(false), variant: 'secondary' },
    { label: 'Go to Login', onClick: () => { setModalOpen(false); navigate('/login'); }, variant: 'primary' }
  ];

  return (
    <div>
      <Navbar title="Welcome" />
      <main className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Welcome to Book2Me</h2>
        <p className="text-lg text-gray-600 mb-8">Book rooms and event halls quickly and securely.</p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button
            onClick={handleBookRooms}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700 transition"
          >
            Book Rooms
          </button>

          <button
            onClick={() => navigate('/customer/halls')}
            className="bg-white border border-gray-300 text-gray-800 px-6 py-3 rounded-lg text-lg hover:shadow-md transition"
          >
            View Halls
          </button>
        </div>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="font-bold text-xl mb-2">Wide Selection</h3>
            <p className="text-sm text-gray-600">Choose from standard rooms to luxury suites.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="font-bold text-xl mb-2">Secure Payments</h3>
            <p className="text-sm text-gray-600">Safe checkout with major payment providers (coming soon).</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="font-bold text-xl mb-2">Event Spaces</h3>
            <p className="text-sm text-gray-600">Book halls for weddings, conferences, and more.</p>
          </div>
        </section>
      </main>

      <Modal
        isOpen={modalOpen}
        title={modalContent.title}
        onClose={() => setModalOpen(false)}
        actions={modalActions}
      >
        <p className="text-sm text-gray-700">{modalContent.message}</p>
      </Modal>
    </div>
  );
}
