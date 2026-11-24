// MOCK DATA. Replace with apiFetch calls when the matching/chat API exists.
export type ShiftKind = 'Day shift' | 'Night shift' | 'Rotating';

export interface DatingMember {
  id: string;
  name: string;
  age: number;
  city: string;
  profession: string;
  shift: ShiftKind;
  bio: string;
  interests: string[];
  compatibility: number; // 0-100
  sharedHours: string;
  verified: boolean;
  likesYou: boolean;
  photoUrl?: string;
}

export interface ChatMessage {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: string;
}

export const MEMBERS: DatingMember[] = [
  { id: 'm1', name: 'Nadia', age: 28, city: 'Dhaka', profession: 'Registered Nurse', shift: 'Night shift', bio: 'Night-shift nurse who lives for 7am breakfasts and quiet parks. Looking for someone who understands sleeping in the day.', interests: ['Cooking', 'Reading', 'Walks'], compatibility: 94, sharedHours: 'Free together 8am to 2pm', verified: true, likesYou: true, photoUrl: '/profile/women/women1.jpg' },
  { id: 'm2', name: 'Imran', age: 31, city: 'Dhaka', profession: 'Paramedic', shift: 'Rotating', bio: 'Rotating shifts, steady heart. Gym before sunrise, street food after. Honest conversations over small talk.', interests: ['Fitness', 'Street food', 'Cricket'], compatibility: 89, sharedHours: 'Free together 4 days a week', verified: true, likesYou: true, photoUrl: '/profile/men/men1.jpg' },
  { id: 'm3', name: 'Farhana', age: 27, city: 'Gazipur', profession: 'Teacher', shift: 'Day shift', bio: 'Primary school teacher. Weekend baker, weekday tea drinker. Slow mornings are my love language.', interests: ['Baking', 'Tea', 'Travel'], compatibility: 82, sharedHours: 'Free together evenings', verified: false, likesYou: true, photoUrl: '/profile/women/women2.jpg' },
  { id: 'm4', name: 'Tanvir', age: 30, city: 'Dhaka', profession: 'Network Engineer', shift: 'Night shift', bio: 'On-call engineer. I fix networks at 3am and bad playlists at 4am. Coffee is non-negotiable.', interests: ['Music', 'Coffee', 'Gaming'], compatibility: 91, sharedHours: 'Free together 9am to 3pm', verified: true, likesYou: false, photoUrl: '/profile/men/men2.jpg' },
  { id: 'm5', name: 'Rafiq', age: 33, city: 'Dhaka', profession: 'Emergency Doctor', shift: 'Rotating', bio: 'ER doctor, terrible at texting back during shifts, great at showing up. Hiking when I can.', interests: ['Hiking', 'Photography', 'Films'], compatibility: 86, sharedHours: 'Free together weekends', verified: true, likesYou: false, photoUrl: '/profile/men/men3.jpg' },
  { id: 'm6', name: 'Sumaiya', age: 26, city: 'Dhaka', profession: 'Pharmacist', shift: 'Day shift', bio: 'Pharmacist with a plant collection that is getting out of hand. Looking for something real.', interests: ['Plants', 'Art', 'Food'], compatibility: 78, sharedHours: 'Free together evenings', verified: false, likesYou: false, photoUrl: '/profile/women/women3.jpg' },
  { id: 'm7', name: 'Arif', age: 29, city: 'Gazipur', profession: 'Firefighter', shift: 'Day shift', bio: 'Firefighter who cooks a mean biryani. Calm under pressure, loud at football matches.', interests: ['Football', 'Cooking', 'Road trips'], compatibility: 84, sharedHours: 'Free together evenings', verified: true, likesYou: false, photoUrl: '/profile/men/men4.jpg' },
  { id: 'm8', name: 'Tasnim', age: 30, city: 'Dhaka', profession: 'Midwife', shift: 'Rotating', bio: 'Midwife who has seen the best mornings. Looking for kind, patient and funny.', interests: ['Yoga', 'Books', 'Cafes'], compatibility: 88, sharedHours: 'Free together 3 days a week', verified: true, likesYou: true, photoUrl: '/profile/women/women4.jpeg' },
  { id: 'm9', name: 'Mitu', age: 25, city: 'Dhaka', profession: 'Lab Technician', shift: 'Night shift', bio: 'Night-lab technician and a very serious tea person. Quiet mornings, long walks, good conversations.', interests: ['Tea', 'Walks', 'Photography'], compatibility: 80, sharedHours: 'Free together 9am to 1pm', verified: false, likesYou: true, photoUrl: '/profile/women/women5.jpg' },
];

export const MATCH_IDS = ['m1', 'm2'];

export const CONVERSATIONS: Record<string, ChatMessage[]> = {
  m1: [
    { id: 'a1', from: 'them', text: 'Hi! Just got off shift. Do you do breakfast dates?', at: '07:42' },
    { id: 'a2', from: 'me', text: 'Absolutely. 8am works for me too.', at: '07:50' },
    { id: 'a3', from: 'them', text: 'Perfect. I know a quiet place near the lake.', at: '08:05' },
  ],
  m2: [{ id: 'b1', from: 'them', text: 'Great to match with you. How is your week looking?', at: 'Yesterday' }],
};

export const memberById = (id: string): DatingMember | undefined =>
  MEMBERS.find((member) => member.id === id);