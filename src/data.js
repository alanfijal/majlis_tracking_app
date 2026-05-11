import { reactive } from 'vue'

export const clients = reactive([
  { id: 1, name: 'Müller Holdings', email: 'contact@muller-h.de', phone: '+34 600 000 001', languages: ['DE', 'EN'] },
  { id: 2, name: 'Hernandez Family', email: 'info@hernandez.es', phone: '+34 600 000 002', languages: ['ES'] },
  { id: 3, name: 'Petrov Estate', email: 'office@petrov.ru', phone: '+34 600 000 003', languages: ['RU', 'EN'] },
  { id: 4, name: 'Sarah Whitmore', email: 'sarah@whitmore.uk', phone: '+34 600 000 004', languages: ['EN'] },
  { id: 5, name: 'Al-Rashid Group', email: 'office@alrashid.ae', phone: '+34 600 000 005', languages: ['EN', 'AR'] },
  { id: 6, name: 'Rosenberg', email: 'd.rosenberg@mail.com', phone: '+34 600 000 006', languages: ['EN'] },
  { id: 7, name: 'Lindqvist', email: 'lindqvist@mail.se', phone: '+34 600 000 007', languages: ['EN', 'SV'] },
  { id: 8, name: 'Bianchi', email: 'm.bianchi@mail.it', phone: '+34 600 000 008', languages: ['EN', 'IT'] },
  { id: 9, name: 'Kowalski', email: 'kowalski@mail.pl', phone: '+34 600 000 009', languages: ['EN', 'PL'] }
])

export const projects = reactive([
  { id: 1, name: 'Villa Sierra Blanca', clientId: 1, location: 'Marbella', budget: 285000, currency: 'EUR', languages: ['DE', 'EN'], status: 'ongoing', startDate: '2026-04-08', endDate: '2026-06-22' },
  { id: 2, name: 'Penthouse Banús', clientId: 2, location: 'Puerto Banús', budget: 95000, currency: 'EUR', languages: ['ES'], status: 'sales', startDate: '2026-05-15', endDate: '2026-05-30' },
  { id: 3, name: 'Casa del Mar', clientId: 3, location: 'Estepona', budget: 420000, currency: 'EUR', languages: ['RU', 'EN'], status: 'ongoing', startDate: '2026-03-01', endDate: '2026-07-15' },
  { id: 4, name: 'Apartment La Cala', clientId: 4, location: 'La Cala', budget: 48000, currency: 'EUR', languages: ['EN'], status: 'new', startDate: '2026-05-20', endDate: '2026-06-10' },
  { id: 5, name: 'Villa Andalucía', clientId: 5, location: 'Benahavís', budget: 380000, currency: 'EUR', languages: ['EN'], status: 'ongoing', startDate: '2026-04-22', endDate: '2026-09-05' },
  { id: 6, name: 'Master suite redesign', clientId: 6, location: 'Marbella', budget: 62000, currency: 'EUR', languages: ['EN'], status: 'new', startDate: '2026-06-01', endDate: '2026-06-25' },
  { id: 7, name: 'Costa residence', clientId: 7, location: 'Nueva Andalucía', budget: 145000, currency: 'EUR', languages: ['EN', 'SV'], status: 'sales', startDate: '2026-05-25', endDate: '2026-06-12' },
  { id: 8, name: 'Pool house & terrace', clientId: 2, location: 'Puerto Banús', budget: 88000, currency: 'EUR', languages: ['ES'], status: 'ongoing', startDate: '2026-05-02', endDate: '2026-06-08' },
  { id: 9, name: 'Casa Almendro', clientId: 8, location: 'El Madroñal', budget: 210000, currency: 'EUR', languages: ['EN', 'IT'], status: 'snagg', startDate: '2026-02-12', endDate: '2026-05-18' },
  { id: 10, name: 'Apartment refurb', clientId: 4, location: 'La Cala', budget: 35000, currency: 'EUR', languages: ['EN'], status: 'new', startDate: '2026-06-15', endDate: '2026-07-08' },
  { id: 11, name: 'Villa Cascada', clientId: 9, location: 'Sotogrande', budget: 175000, currency: 'EUR', languages: ['EN', 'PL'], status: 'snagg', startDate: '2026-04-30', endDate: '2026-05-22' }
])

export const statusOptions = [
  { value: 'new', label: 'New project' },
  { value: 'sales', label: 'Sales' },
  { value: 'ongoing', label: 'On-going' },
  { value: 'snagg', label: 'Snagg list' }
]

export const languageOptions = [
  { value: 'EN', label: 'English' },
  { value: 'ES', label: 'Spanish' },
  { value: 'DE', label: 'German' },
  { value: 'FR', label: 'French' },
  { value: 'IT', label: 'Italian' },
  { value: 'PL', label: 'Polish' },
  { value: 'RU', label: 'Russian' },
  { value: 'AR', label: 'Arabic' },
  { value: 'NL', label: 'Dutch' },
  { value: 'SV', label: 'Swedish' }
]

export const currencyOptions = [
  { value: 'EUR', symbol: '€' },
  { value: 'USD', symbol: '$' },
  { value: 'GBP', symbol: '£' },
  { value: 'AED', symbol: 'AED' },
  { value: 'CHF', symbol: 'CHF' }
]
