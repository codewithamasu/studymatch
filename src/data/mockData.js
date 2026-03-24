// Mock data for StudyMatch MVP demo
// This will be replaced with Supabase data later

export const mockUsers = [
  {
    id: '1',
    full_name: 'Andi Pratama',
    email: 'andi@univ.ac.id',
    password: '123',
    university: 'Universitas Indonesia',
    avatar_url: null,
    bio: 'Passionate about algorithms and data structures. Love collaborative learning!',
    study_profile: {
      subjects: ['Data Structures', 'Algorithms', 'Calculus'],
      skill_level: 'intermediate',
      study_goal: 'exam_prep',
      availability: { days: ['mon', 'wed', 'fri'], start: '19:00', end: '21:00' },
      learning_style: 'visual',
    },
  },
  {
    id: '2',
    full_name: 'Sari Dewi',
    email: 'sari@univ.ac.id',
    password: '123',
    university: 'Institut Teknologi Bandung',
    avatar_url: null,
    bio: 'Math enthusiast looking for study buddies. Currently preparing for final exams.',
    study_profile: {
      subjects: ['Calculus', 'Linear Algebra', 'Statistics'],
      skill_level: 'advanced',
      study_goal: 'exam_prep',
      availability: { days: ['tue', 'thu', 'sat'], start: '18:00', end: '20:00' },
      learning_style: 'auditory',
    },
  },
  {
    id: '3',
    full_name: 'Budi Santoso',
    email: 'budi@univ.ac.id',
    password: '123',
    university: 'Universitas Gadjah Mada',
    avatar_url: null,
    bio: 'Software engineering student. Looking for project partners and study groups.',
    study_profile: {
      subjects: ['Web Development', 'Data Structures', 'Database Systems'],
      skill_level: 'intermediate',
      study_goal: 'project',
      availability: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '20:00', end: '22:00' },
      learning_style: 'kinesthetic',
    },
  },
  {
    id: '4',
    full_name: 'Maya Kartika',
    email: 'maya@univ.ac.id',
    password: '123',
    university: 'Universitas Indonesia',
    avatar_url: null,
    bio: 'Love physics and math. Looking for someone to discuss problems with!',
    study_profile: {
      subjects: ['Physics', 'Calculus', 'Differential Equations'],
      skill_level: 'beginner',
      study_goal: 'skill_building',
      availability: { days: ['wed', 'fri', 'sat'], start: '14:00', end: '16:00' },
      learning_style: 'visual',
    },
  },
  {
    id: '5',
    full_name: 'Rizky Fadillah',
    email: 'rizky@univ.ac.id',
    password: '123',
    university: 'Institut Teknologi Sepuluh Nopember',
    avatar_url: null,
    bio: 'Competitive programmer and ML enthusiast. Always up for a coding session!',
    study_profile: {
      subjects: ['Machine Learning', 'Algorithms', 'Python Programming'],
      skill_level: 'advanced',
      study_goal: 'skill_building',
      availability: { days: ['mon', 'wed', 'sat'], start: '19:00', end: '21:00' },
      learning_style: 'kinesthetic',
    },
  },
  {
    id: '6',
    full_name: 'Putri Ayu',
    email: 'putri@univ.ac.id',
    password: '123',
    university: 'Universitas Padjadjaran',
    avatar_url: null,
    bio: 'Economics student interested in data analysis and statistics.',
    study_profile: {
      subjects: ['Statistics', 'Econometrics', 'Data Analysis'],
      skill_level: 'intermediate',
      study_goal: 'exam_prep',
      availability: { days: ['tue', 'thu'], start: '17:00', end: '19:00' },
      learning_style: 'auditory',
    },
  },
]

export const mockCurrentUser = {
  id: 'current',
  full_name: 'Demo User',
  email: 'demo@studymatch.id',
  password: '123',
  university: 'Universitas Indonesia',
  avatar_url: null,
  bio: 'Computer science student looking for study partners!',
  study_profile: {
    subjects: ['Data Structures', 'Calculus', 'Algorithms'],
    skill_level: 'intermediate',
    study_goal: 'exam_prep',
    availability: { days: ['mon', 'wed', 'fri'], start: '19:00', end: '21:00' },
    learning_style: 'visual',
  },
}

export const mockMatches  = [
  {
    id: 'm1',
    partner: mockUsers[0],
    compatibility_score: 92,
    matched_at: '2026-03-10T14:30:00Z',
    breakdown: { subjects: 95, schedule: 90, goals: 100, skills: 80 },
  },
  {
    id: 'm2',
    partner: mockUsers[1],
    compatibility_score: 78,
    matched_at: '2026-03-11T09:15:00Z',
    breakdown: { subjects: 70, schedule: 60, goals: 100, skills: 75 },
  },
]

export const mockSessions = [
  {
    id: 's1',
    match_id: 'm1',
    partner: mockUsers[0],
    subject: 'Data Structures',
    scheduled_at: '2026-03-15T19:00:00Z',
    duration_minutes: 90,
    mode: 'online',
    meeting_room_id: 'studymatch-session-4521',
    status: 'upcoming',
  },
  {
    id: 's2',
    match_id: 'm2',
    partner: mockUsers[1],
    subject: 'Calculus',
    scheduled_at: '2026-03-16T18:00:00Z',
    duration_minutes: 60,
    mode: 'offline',
    location: 'Perpustakaan Pusat UI',
    status: 'upcoming',
  },
  {
    id: 's3',
    match_id: 'm1',
    partner: mockUsers[0],
    subject: 'Algorithms',
    scheduled_at: '2026-03-08T19:00:00Z',
    duration_minutes: 120,
    mode: 'online',
    meeting_room_id: 'studymatch-session-3210',
    status: 'completed',
  },
  {
    id: 's4',
    match_id: 'm2',
    partner: mockUsers[1],
    subject: 'Linear Algebra',
    scheduled_at: '2026-03-05T18:00:00Z',
    duration_minutes: 90,
    mode: 'offline',
    location: 'Cafe Study Corner',
    status: 'completed',
  },
]

export const mockStats = {
  total_sessions: 8,
  completed_sessions: 6,
  total_study_hours: 15,
  study_streak: 5,
  favorite_subject: 'Data Structures',
  weekly_data: [
    { day: 'Mon', hours: 2 },
    { day: 'Tue', hours: 0 },
    { day: 'Wed', hours: 3 },
    { day: 'Thu', hours: 1 },
    { day: 'Fri', hours: 2.5 },
    { day: 'Sat', hours: 1.5 },
    { day: 'Sun', hours: 0 },
  ],
}

// Compatibility calculation helper
export function calculateCompatibility(userA, userB) {
  const profileA = userA.study_profile
  const profileB = userB.study_profile

  // Subject match
  const commonSubjects = profileA.subjects.filter(s => profileB.subjects.includes(s))
  const subjectScore = (commonSubjects.length / Math.max(profileA.subjects.length, profileB.subjects.length)) * 100

  // Schedule overlap
  const commonDays = profileA.availability.days.filter(d => profileB.availability.days.includes(d))
  const scheduleScore = (commonDays.length / Math.max(profileA.availability.days.length, profileB.availability.days.length)) * 100

  // Goal alignment
  const goalScore = profileA.study_goal === profileB.study_goal ? 100 : 50

  // Skill proximity
  const levels = { beginner: 1, intermediate: 2, advanced: 3 }
  const skillDiff = Math.abs(levels[profileA.skill_level] - levels[profileB.skill_level])
  const skillScore = skillDiff === 0 ? 100 : skillDiff === 1 ? 70 : 40

  const total = Math.round(subjectScore * 0.4 + scheduleScore * 0.3 + goalScore * 0.2 + skillScore * 0.1)

  return {
    total,
    breakdown: {
      subjects: Math.round(subjectScore),
      schedule: Math.round(scheduleScore),
      goals: Math.round(goalScore),
      skills: Math.round(skillScore),
    },
  }
}
