'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function MobileHomeContactForm() {
  const t = useTranslations('MobileHomeForm');

  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    contactName: '',
    email: '',
    phone: '',
    message: '',
    interestedModel: '50',
    projectedVolume: '1-5',
    fundingStatus: 'equity',
  });

  const [errors, setErrors] = useState({
    companyName: '',
    role: '',
    contactName: '',
    email: '',
    phone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    let valid = true;
    const newErrors = {
      companyName: '',
      role: '',
      contactName: '',
      email: '',
      phone: '',
    };

    if (!formData.companyName.trim()) {
      newErrors.companyName = t('errorCompanyRequired');
      valid = false;
    }
    if (!formData.role.trim()) {
      newErrors.role = t('errorRoleRequired');
      valid = false;
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = t('errorNameRequired');
      valid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = t('errorEmailRequired');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errorEmailRequired'); // Or generic email validation error
      valid = false;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('errorPhoneRequired');
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (validate()) {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project: 'mobilehome',
            companyName: formData.companyName,
            role: formData.role,
            contactName: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            preferredSize: formData.interestedModel,
            projectedVolume: formData.projectedVolume,
            fundingStatus: formData.fundingStatus,
            message: formData.message,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit the form.');
        }

        console.log('📬 Modular Mobile Home B2B Form Submission Success:', data);
        setIsSubmitted(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Hiba történt a küldés során. Kérjük, próbálja meg újra.';
        console.error('Submission error:', err);
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center max-w-xl mx-auto shadow-lg shadow-emerald-500/5">
        <h3 className="text-2xl font-bold text-emerald-400 mb-4">{t('successTitle')}</h3>
        <p className="text-slate-300 mb-6 leading-relaxed">
          {t('successMessage')}
        </p>
        <button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({
              companyName: '',
              role: '',
              contactName: '',
              email: '',
              phone: '',
              message: '',
              interestedModel: '50',
              projectedVolume: '1-5',
              fundingStatus: 'equity',
            });
          }}
          className="px-6 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 hover:border-slate-700 transition-all font-semibold text-sm cursor-pointer shadow-xl shadow-black/50"
        >
          {t('newSubmission')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 max-w-xl mx-auto p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm shadow-xl">
      {submitError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">{t('contactNameLabel')}</label>
          <input
            type="text"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-slate-100 focus:outline-none transition-colors ${
              errors.contactName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
            }`}
            placeholder={t('contactNamePlaceholder')}
          />
          {errors.contactName && <p className="text-red-400 text-xs mt-1.5">{errors.contactName}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">{t('companyNameLabel')}</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-slate-100 focus:outline-none transition-colors ${
              errors.companyName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
            }`}
            placeholder={t('companyNamePlaceholder')}
          />
          {errors.companyName && <p className="text-red-400 text-xs mt-1.5">{errors.companyName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">{t('roleLabel')}</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-slate-100 focus:outline-none transition-colors ${
              errors.role ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
            }`}
            placeholder={t('rolePlaceholder')}
          />
          {errors.role && <p className="text-red-400 text-xs mt-1.5">{errors.role}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">{t('phoneLabel')}</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-slate-100 focus:outline-none transition-colors ${
              errors.phone ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
            }`}
            placeholder={t('phonePlaceholder')}
          />
          {errors.phone && <p className="text-red-400 text-xs mt-1.5">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">{t('emailLabel')}</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-slate-100 focus:outline-none transition-colors ${
            errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
          }`}
          placeholder={t('emailPlaceholder')}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">{t('interestedModelLabel')}</label>
          <select
            name="interestedModel"
            value={formData.interestedModel}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="30">{t('model30')}</option>
            <option value="50">{t('model50')}</option>
            <option value="80-100">{t('model80-100')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">{t('projectedVolumeLabel')}</label>
          <select
            name="projectedVolume"
            value={formData.projectedVolume}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="1-5">{t('volume1-5')}</option>
            <option value="6-20">{t('volume6-20')}</option>
            <option value="21+">{t('volume21+')}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">{t('fundingStatusLabel')}</label>
        <select
          name="fundingStatus"
          value={formData.fundingStatus}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
        >
          <option value="equity">{t('fundingEquity')}</option>
          <option value="loan">{t('fundingLoan')}</option>
          <option value="partner">{t('fundingPartner')}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">{t('messageLabel')}</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          placeholder={t('messagePlaceholder')}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-base shadow-xl shadow-black/50 hover:shadow-black/70 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Küldés folyamatban...' : t('submitBtn')}
      </button>
    </form>
  );
}
