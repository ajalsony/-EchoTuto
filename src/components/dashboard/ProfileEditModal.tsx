import React, { useState } from 'react';
import { X, Check, Loader2, AlertCircle, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { StudentProfileData, ExperienceLevel, EducationLevel } from '../../types';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotice: (msg: string) => void;
}

const educationOptions: EducationLevel[] = [
  'Undergraduate',
  'Postgraduate',
  'High School',
  'Doctorate',
  'Diploma',
  'Other',
];

const studyYearOptions = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year / Final Year',
  'Recent Graduate (2025)',
  'Recent Graduate (2024)',
  'Alumni / Working Professional',
];

const experienceOptions: ExperienceLevel[] = ['Fresher', 'Internship', 'Experienced'];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  onSuccessNotice,
}) => {
  const { profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(
    (profile?.educationLevel as EducationLevel) || 'Undergraduate'
  );
  const [courseDegree, setCourseDegree] = useState(profile?.courseDegree || '');
  const [studyYear, setStudyYear] = useState(profile?.studyYear || '1st Year');
  const [college, setCollege] = useState(profile?.college || '');
  const [targetRole, setTargetRole] = useState(profile?.targetRole || '');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    profile?.experienceLevel || 'Fresher'
  );
  const [skills, setSkills] = useState(profile?.skills || '');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const updates: Partial<StudentProfileData> = {
      fullName: fullName.trim(),
      age: age ? Number(age) : '',
      educationLevel,
      courseDegree: courseDegree.trim(),
      studyYear,
      college: college.trim() || undefined,
      targetRole: targetRole.trim() || undefined,
      experienceLevel,
      skills: skills.trim() || undefined,
    };

    const { error } = await updateProfile(updates);
    setIsSaving(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      onSuccessNotice('Candidate dossier updated successfully.');
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0B0D]/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl bg-[#14181B] border border-white/[0.1] rounded-xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
        <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-br" aria-hidden="true">+</span>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A0B0D] border border-white/[0.1] flex items-center justify-center text-[#00F0FF]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-widest font-bold block">
                CANDIDATE DOSSIER // AUTHENTICATED
              </span>
              <h2 id="dossier-modal-title" className="font-syne text-xl text-white font-bold uppercase tracking-wide">
                Edit Candidate Academic & Career Profile
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9EA6B0] hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-xs font-mono text-[#FF4D6D] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#0A0B0D] text-sm font-mono px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                Age
              </label>
              <input
                type="number"
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-[#0A0B0D] text-sm font-mono px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                Education Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                className="w-full bg-[#0A0B0D] text-sm font-mono px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none text-white"
              >
                {educationOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#14181B] text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                Study Year / Cohort
              </label>
              <select
                value={studyYear}
                onChange={(e) => setStudyYear(e.target.value)}
                className="w-full bg-[#0A0B0D] text-sm font-mono px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none text-white"
              >
                {studyYearOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#14181B] text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                Course or Degree
              </label>
              <input
                type="text"
                value={courseDegree}
                onChange={(e) => setCourseDegree(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full bg-[#0A0B0D] text-sm font-mono px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                College / Institution
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. IIT Delhi"
                className="w-full bg-[#0A0B0D] text-sm font-mono px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                Target Job Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. SDE-1 / Staff Software Engineer"
                className="w-full bg-[#0A0B0D] text-sm font-mono px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full bg-[#0A0B0D] text-sm font-mono px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none text-white"
              >
                {experienceOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#14181B] text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
              Technical Focus & Skills
            </label>
            <textarea
              rows={2}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Distributed Systems, Rust, Python, Concurrency, STAR Narrative Framework"
              className="w-full bg-[#0A0B0D] text-sm font-mono p-3 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none text-white leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg daemon-card daemon-card-hover text-[#9EA6B0] hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.98] text-[#0A0B0D] font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
