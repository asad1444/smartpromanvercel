import React, { useState, useRef, useEffect } from 'react';
import { api } from './api';
import { I } from './icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './MyProfile.css';

export default function MyProfile() {
  const [formData, setFormData] = useState({
    companyName: '',
    inchargeName: '',
    inchargePhone: '',
    email: '',
    city: '',
    zone: '',
    serviceType: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [avatar, setAvatar] = useState(() => {
    try {
      return sessionStorage.getItem('profileImage') || null;
    } catch {
      return null;
    }
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.getCurrentUserProfile();
        const user = response?.company || response?.user || response;
        if (user) {
          setFormData({
            companyName: user.companyName || user.CompanyName || '',
            inchargeName: user.inchargeName || user.InchargeName || user.fullName || user.FullName || '',
            inchargePhone: user.inchargePhone || user.InchargePhone || '',
            email: user.email || user.Email || '',
            city: user.city || user.City || '',
            zone: user.zone || user.Zone || '',
            serviceType: user.serviceType || user.ServiceType || '',
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
          });

          if (user.companyLogo || user.CompanyLogo) {
            setAvatar(user.companyLogo || user.CompanyLogo);
            sessionStorage.setItem('profileImage', user.companyLogo || user.CompanyLogo);
          }

          // Keep sessionStorage sync if needed by layout
          const savedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
          sessionStorage.setItem('user', JSON.stringify({
            ...savedUser,
            fullName: user.inchargeName || user.InchargeName || user.fullName || user.FullName || '',
            email: user.email || user.Email || '',
          }));
        }
      } catch (e) {
        toast.error('Unable to load profile. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target.result;
      setAvatar(imageData);
      sessionStorage.setItem('profileImage', imageData);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!formData.companyName.trim() || !formData.email.trim() || !formData.inchargeName.trim()) {
      toast.error('Company Name, Incharge Name, and Email are required.');
      return;
    }

    try {
      setSaving(true);

      await api.updateCurrentUserProfile({
        companyName: formData.companyName.trim(),
        inchargeName: formData.inchargeName.trim(),
        inchargePhone: formData.inchargePhone.trim(),
        email: formData.email.trim(),
        city: formData.city.trim(),
        zone: formData.zone.trim(),
        serviceType: formData.serviceType.trim(),
        companyLogo: avatar,
      });

      if (formData.oldPassword || formData.newPassword || formData.confirmPassword) {
        if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
          toast.error('Please complete all password fields to change password.');
          setSaving(false);
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('New password and confirm password do not match.');
          setSaving(false);
          return;
        }

        await api.changePassword({
          currentPassword: formData.oldPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        });
        
        toast.success('Password changed successfully!');
      }

      const savedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      sessionStorage.setItem('user', JSON.stringify({
        ...savedUser,
        fullName: formData.inchargeName.trim(),
        email: formData.email.trim(),
      }));

      if (avatar) localStorage.setItem('company_logo', avatar);
      localStorage.setItem('company_name', formData.companyName.trim());
      localStorage.setItem('company_incharge_name', formData.inchargeName.trim());
      localStorage.setItem('company_email', formData.email.trim());

      window.dispatchEvent(new Event('profile-updated'));

      toast.success('Profile Updated Successfully!');
      setFormData((prev) => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (e) {
      toast.error(e.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (formData.inchargeName || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'U';

  return (
    <div className="profile-page">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="light" />
      <div className="profile-container animated-fade-in">
        <div className="profile-banner">
          <div className="profile-avatar-wrap" onClick={handlePhotoClick} title="Change Picture">
            {avatar ? <img src={avatar} alt="Profile" /> : <span>{initials}</span>}
            <div className="profile-cam-btn">{I.camera}</div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
        </div>

        <div className="profile-header-info">
          <div className="phi-left">
            <div className="phi-name">{loading ? 'Loading...' : (formData.inchargeName || 'User')}</div>
            <div className="phi-role">
              <span className="phi-role-badge">COMPANY</span>
              {formData.companyName || 'SmartProMan Account'}
            </div>
          </div>
        </div>

        <div className="profile-body">
          <div className="profile-section">
            <div className="ps-title">{I.userIco} Company & Personal Info</div>
            <div className="ps-grid">
              <div className="p-field">
                <label>Company Name</label>
                <div className="p-input-wrap">
                  <span className="p-input-ico">{I.briefcase}</span>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="p-input" placeholder="e.g. Acme Corp" />
                </div>
              </div>
              <div className="p-field">
                <label>Incharge / Manager Name</label>
                <div className="p-input-wrap">
                  <span className="p-input-ico">{I.userIco}</span>
                  <input type="text" name="inchargeName" value={formData.inchargeName} onChange={handleChange} className="p-input" placeholder="Full Name" />
                </div>
              </div>
              <div className="p-field">
                <label>Email Address</label>
                <div className="p-input-wrap">
                  <span className="p-input-ico">{I.mail}</span>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="p-input" placeholder="email@company.com" />
                </div>
              </div>
              <div className="p-field">
                <label>Phone Number</label>
                <div className="p-input-wrap">
                  <span className="p-input-ico">{I.phone}</span>
                  <input type="text" name="inchargePhone" value={formData.inchargePhone} onChange={handleChange} className="p-input" placeholder="+92 300 0000000" />
                </div>
              </div>
              <div className="p-field">
                <label>City</label>
                <div className="p-input-wrap">
                  <span className="p-input-ico">{I.location}</span>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="p-input" placeholder="e.g. Karachi" />
                </div>
              </div>
              <div className="p-field">
                <label>Zone / Area</label>
                <div className="p-input-wrap">
                  <span className="p-input-ico">{I.mapPin}</span>
                  <input type="text" name="zone" value={formData.zone} onChange={handleChange} className="p-input" placeholder="e.g. DHA Phase 6" />
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="ps-title">{I.shield} Security & Password</div>
            <div className="ps-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="p-field">
                <label>Current Password</label>
                <div className="p-input-wrap">
                  <span className="p-input-ico">{I.lock}</span>
                  <input type="password" name="oldPassword" placeholder="Enter current password (leave blank if not changing)" value={formData.oldPassword} onChange={handleChange} className="p-input" />
                </div>
              </div>

              <div className="ps-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="p-field">
                  <label>New Password</label>
                  <div className="p-input-wrap">
                    <span className="p-input-ico">{I.lock}</span>
                    <input type="password" name="newPassword" placeholder="Enter new password" value={formData.newPassword} onChange={handleChange} className="p-input" />
                  </div>
                </div>
                <div className="p-field">
                  <label>Confirm New Password</label>
                  <div className="p-input-wrap">
                    <span className="p-input-ico">{I.checkCirc}</span>
                    <input type="password" name="confirmPassword" placeholder="Confirm new password" value={formData.confirmPassword} onChange={handleChange} className="p-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-footer">
          <button className="p-btn-save" onClick={handleSave} disabled={loading || saving}>
            {I.checkCirc} {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
