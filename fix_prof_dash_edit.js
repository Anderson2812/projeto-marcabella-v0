const fs = require('fs');
let code = fs.readFileSync('components/ProfessionalDashboard.tsx', 'utf8');

// Insert states
const statesToInsert = `
  const [isEditServicesModalOpen, setIsEditServicesModalOpen] = useState(false);
  const [editServicesBooking, setEditServicesBooking] = useState<Booking | null>(null);
  const [selectedEditServices, setSelectedEditServices] = useState<{ id: string; name: string; price: number; durationMinutes: number; variation?: string }[]>([]);

  const handleOpenEditServicesModal = (b: Booking) => {
    setEditServicesBooking(b);
    setSelectedEditServices(b.servicesList || [{
      id: b.serviceId,
      name: b.serviceName,
      price: b.totalPrice,
      durationMinutes: b.serviceDuration || 60,
      variation: b.serviceVariation
    }]);
    setIsEditServicesModalOpen(true);
  };

  const handleSaveEditServices = () => {
    if (editServicesBooking && selectedEditServices.length > 0) {
      updateBookingServices(editServicesBooking.id, selectedEditServices);
      setIsEditServicesModalOpen(false);
      showToast('Serviços atualizados com sucesso!');
    }
  };

  const toggleEditServiceSelection = (srv: ServiceItem) => {
    setSelectedEditServices(prev => {
      const exists = prev.find(s => s.id === srv.id);
      if (exists) {
        return prev.filter(s => s.id !== srv.id);
      } else {
        return [...prev, { id: srv.id, name: srv.name, price: srv.price, durationMinutes: srv.durationMinutes }];
      }
    });
  };
`;

code = code.replace(
  "  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);",
  "  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);\n" + statesToInsert
);

// We need updateBookingServices from useAppStore
code = code.replace(
  "rescheduleBooking,",
  "rescheduleBooking,\n    updateBookingServices,"
);

fs.writeFileSync('components/ProfessionalDashboard.tsx', code);
