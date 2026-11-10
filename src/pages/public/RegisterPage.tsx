import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ServiceArea } from '../../types';
import { UserPlus, AlertCircle, CheckCircle2, ShoppingBag, Bike } from 'lucide-react';

interface RegisterPageProps {
  setCurrentTab: (tab: string) => void;
  initialType?: 'customer' | 'runner';
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ setCurrentTab, initialType = 'customer' }) => {
  const { setUser } = useAuth();
  const [registerType, setRegisterType] = useState<'customer' | 'runner'>(initialType);
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [building, setBuilding] = useState('');
  const [locality, setLocality] = useState('');
  const [landmark, setLandmark] = useState('');
  const [language, setLanguage] = useState('Hindi, Marathi');
  const [serviceAreaId, setServiceAreaId] = useState('area_1');
  const [vehicleType, setVehicleType] = useState('Two Wheeler (Scooter/Bike)');
  const [languagesSpoken, setLanguagesSpoken] = useState('Hindi, Marathi, English');
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    fetch('/api/v1/public/info')
      .then(res => res.json())
      .then(data => {
        if (data.serviceAreas) {
          setAreas(data.serviceAreas);
          if (data.serviceAreas.length > 0) {
            setServiceAreaId(data.serviceAreas[0].id);
            setLocality(data.serviceAreas[0].name);
          }
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleAreaChange = (areaId: string) => {
    setServiceAreaId(areaId);
    const selected = areas.find(a => a.id === areaId);
    if (selected) {
      setLocality(selected.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match! Please make sure both password fields are identical.');
      return;
    }
    if (!consent) {
      setError('Please agree to the Terms of Service & Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const endpoint = registerType === 'customer' 
      ? '/api/v1/auth/register/customer' 
      : '/api/v1/auth/register/runner';

    const payload = registerType === 'customer' ? {
      name,
      phone,
      email,
      password,
      address,
      building,
      locality,
      landmark,
      language,
      serviceAreaId,
    } : {
      name,
      phone,
      email,
      password,
      address,
      serviceAreaId,
      languages: languagesSpoken.split(',').map(s => s.trim()),
      vehicleType,
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        if (registerType === 'customer') {
          localStorage.setItem('mpartner_token', data.token);
          setUser(data.user);
          setCurrentTab('dashboard');
        } else {
          setSuccess(data.message || 'Application submitted successfully! Your account will be activated following Admin review.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-xl w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-neutral-200 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto">
            M
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
            {registerType === 'customer' ? 'Create Customer Account' : 'Apply as Local Runner'}
          </h2>
          <p className="text-xs text-neutral-500">
            Powered by <strong className="text-neutral-800">Mãrçò 💯</strong> • Your Needs. Your Trusted Partner.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setRegisterType('customer'); setError(null); setSuccess(null); }}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
              registerType === 'customer' ? 'bg-white text-black shadow-xs font-bold' : 'text-neutral-600 hover:text-black'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Signup</span>
          </button>
          <button
            type="button"
            onClick={() => { setRegisterType('runner'); setError(null); setSuccess(null); }}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
              registerType === 'runner' ? 'bg-white text-black shadow-xs font-bold' : 'text-neutral-600 hover:text-black'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Become a Runner</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-emerald-900">Application Submitted!</h4>
            <p className="text-xs text-emerald-700 leading-relaxed">{success}</p>
            <div className="pt-2">
              <button
                onClick={() => setCurrentTab('login')}
                className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 22222"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="e.g. user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Set Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-neutral-700">Confirm Password *</label>
                  {confirmPassword && (
                    <span className={`text-[10px] font-bold ${password === confirmPassword ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {password === confirmPassword ? '✓ Passwords match' : '✗ Do not match'}
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-rose-400 focus:ring-rose-200' 
                      : 'border-neutral-300 focus:ring-black'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Full Street Address *</label>
              <textarea
                rows={2}
                required
                placeholder="House / Flat No., Street, Cross Road"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Service Area / Hub *</label>
                <select
                  value={serviceAreaId}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}, {a.city} {a.pincode ? `(${a.pincode})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {registerType === 'customer' ? (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Building / Society Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Oakwood Heights"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="Two Wheeler (Electric Scooter)">Electric Scooter</option>
                    <option value="Two Wheeler (Motorcycle)">Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Four Wheeler (Compact Car)">Compact Car</option>
                  </select>
                </div>
              )}
            </div>

            {registerType === 'customer' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Corner House"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Preferred Language</label>
                  <input
                    type="text"
                    placeholder="e.g. English, Kannada, Hindi"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Languages Spoken</label>
                <input
                  type="text"
                  placeholder="e.g. English, Kannada, Hindi, Tamil"
                  value={languagesSpoken}
                  onChange={(e) => setLanguagesSpoken(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-neutral-300 text-black focus:ring-black"
                />
                <span className="text-[11px] text-neutral-600 leading-snug">
                  I agree to M-PARTNER's Terms & Conditions, Privacy Policy, and understand that subscription credits cover order-delivery services while product costs are debited separately.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {loading 
                    ? 'Processing...' 
                    : registerType === 'customer' 
                      ? 'Register & Connect with Runner' 
                      : 'Submit Runner Application'}
                </span>
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-xs text-neutral-500 pt-2 border-t border-neutral-100">
          Already registered?{' '}
          <button
            onClick={() => setCurrentTab('login')}
            className="font-bold text-black hover:underline cursor-pointer"
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
};
