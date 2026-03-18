import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const createInitialProfile = () => ({
  subjects: [],
  subject_mastery: {},
  skill_level: '',
  study_goal: '',
  study_goals: [],
  study_mode: 'online',
  language: 'id',
  preferred_times: [],
  availability: { days: [], start: '19:00', end: '21:00' },
  learning_style: '',
})

export const useOnboardingStore = create(
  devtools(
    persist(
      (set, get) => ({
        step: 0,
        profile: createInitialProfile(),
        saving: false,
        errorMessage: '',

        setStep: (step) => set({ step }),

        nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 2) })),

        prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 0) })),

        setProfile: (updater) =>
          set((state) => ({
            profile:
              typeof updater === 'function'
                ? updater(state.profile)
                : { ...state.profile, ...updater },
          })),

        hydrateProfile: (studyProfile) =>
          set((state) => ({
            profile: {
              ...state.profile,
              ...studyProfile,
              subjects: studyProfile?.subjects || [],
              subject_mastery: studyProfile?.subject_mastery || {},
              study_goals: studyProfile?.study_goals || [],
              preferred_times: studyProfile?.preferred_times || [],
              availability: {
                ...state.profile.availability,
                ...(studyProfile?.availability || {}),
              },
            },
          })),

        toggleSubject: (subject) =>
          set((state) => {
            const subjects = state.profile.subjects.includes(subject)
              ? state.profile.subjects.filter((item) => item !== subject)
              : [...state.profile.subjects, subject]

            return {
              profile: {
                ...state.profile,
                subjects,
              },
            }
          }),

        toggleDay: (day) =>
          set((state) => {
            const days = state.profile.availability.days.includes(day)
              ? state.profile.availability.days.filter((item) => item !== day)
              : [...state.profile.availability.days, day]

            return {
              profile: {
                ...state.profile,
                availability: {
                  ...state.profile.availability,
                  days,
                },
              },
            }
          }),

        setMastery: (subject, value) =>
          set((state) => ({
            profile: {
              ...state.profile,
              subject_mastery: {
                ...state.profile.subject_mastery,
                [subject]: Number(value),
              },
            },
          })),

        toggleStudyGoal: (value) =>
          set((state) => {
            const study_goals = state.profile.study_goals.includes(value)
              ? state.profile.study_goals.filter((goal) => goal !== value)
              : [...state.profile.study_goals, value]

            return {
              profile: {
                ...state.profile,
                study_goals,
              },
            }
          }),

        togglePreferredTime: (value) =>
          set((state) => {
            const preferred_times = state.profile.preferred_times.includes(value)
              ? state.profile.preferred_times.filter((slot) => slot !== value)
              : [...state.profile.preferred_times, value]

            return {
              profile: {
                ...state.profile,
                preferred_times,
              },
            }
          }),

        setSaving: (saving) => set({ saving }),

        setErrorMessage: (errorMessage) => set({ errorMessage }),

        resetOnboarding: () =>
          set({
            step: 0,
            profile: createInitialProfile(),
            saving: false,
            errorMessage: '',
          }),

        canProceed: () => {
          const { step, profile } = get()
          if (step === 0) return profile.subjects.length >= 1
          if (step === 1) return profile.study_goals.length >= 1
          if (step === 2) return profile.availability.days.length >= 1
          return false
        },
      }),
      {
        name: 'studymatch-onboarding',
        partialize: (state) => ({
          step: state.step,
          profile: state.profile,
        }),
      }
    )
  )
)
