const fs = require('fs');
let code = fs.readFileSync('lib/use-app-store.tsx', 'utf8');

const signature = "updateBookingServices: (bookingId: string, newServicesList: { id: string; name: string; price: number; durationMinutes: number; variation?: string }[]) => void;";

code = code.replace(
  "rescheduleBooking: (bookingId: string, newDate: string, newTime: string, newEndTime?: string) => void;",
  `rescheduleBooking: (bookingId: string, newDate: string, newTime: string, newEndTime?: string) => void;
  ${signature}`
);

const implementation = `const updateBookingServices = (bookingId: string, newServicesList: { id: string; name: string; price: number; durationMinutes: number; variation?: string }[]) => {
    emitStoreChange(prev => {
      const nextBookings = prev.bookings.map(b => {
        if (b.id === bookingId) {
          const totalPrice = newServicesList.reduce((acc, s) => acc + s.price, 0);
          const totalDuration = newServicesList.reduce((acc, s) => acc + s.durationMinutes, 0);
          
          // Recalculate end time
          let endTime = b.endTime;
          if (b.time) {
            const [h, m] = b.time.split(':').map(Number);
            const totalMins = h * 60 + m + totalDuration;
            const endH = Math.floor(totalMins / 60) % 24;
            const endM = totalMins % 60;
            endTime = \`\${String(endH).padStart(2, '0')}:\${String(endM).padStart(2, '0')}\`;
          }

          return {
            ...b,
            servicesList: newServicesList,
            serviceId: newServicesList[0]?.id || b.serviceId,
            serviceName: newServicesList.length > 1 ? 'Combo Personalizado' : newServicesList[0]?.name || b.serviceName,
            serviceVariation: newServicesList.length === 1 ? newServicesList[0].variation : undefined,
            totalPrice,
            serviceDuration: totalDuration,
            endTime
          };
        }
        return b;
      });
      return { ...prev, bookings: nextBookings };
    });
  };`;

code = code.replace(
  "const confirmBooking = (id: string) => {",
  `${implementation}\n\n  const confirmBooking = (id: string) => {`
);

code = code.replace(
  "rescheduleBooking,",
  "rescheduleBooking,\n        updateBookingServices,"
);

fs.writeFileSync('lib/use-app-store.tsx', code);
