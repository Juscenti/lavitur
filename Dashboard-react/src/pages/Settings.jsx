import { useEffect, useState } from 'react';
import { api } from '../lib/api';

function Status({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="settings-loading">
        <div className="settings-loading-spinner" aria-hidden />
        <p>Loading settings…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }
  return null;
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const fetchSettings = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/settings')
      .then((data) => setSettings(data || {}))
      .catch((err) => setError(err?.message || 'Failed to load settings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (section, key, value) => {
    setSettings((prev) => ({
      ...(prev || {}),
      [section]: {
        ...(prev?.[section] || {}),
        [key]: value,
      },
    }));
  };

  const save = () => {
    if (!settings) return;
    setSaving(true);
    setSaveMessage('');
    setError('');
    api
      .patch('/admin/settings', settings)
      .then(() => {
        setSaveMessage('Settings saved.');
      })
      .catch((err) => {
        setError(err?.message || 'Failed to save settings.');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h1>Settings</h1>
          <p className="panel-subtitle">
            Global configuration for the storefront and admin tools. Edit below and save when ready.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={saving || loading}
          onClick={save}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </header>

      <Status loading={loading} error={error} onRetry={fetchSettings} />

      {saveMessage && (
        <div className="settings-message settings-message--success" role="status">
          {saveMessage}
        </div>
      )}

      {!loading && settings && (
        <div className="panel-columns">
          <section className="settings-section-card">
            <h2>General</h2>
            <p className="section-desc">Store identity and support contact.</p>
            <div className="settings-form-row">
              <label htmlFor="settings-store-name">Store name</label>
              <input
                id="settings-store-name"
                type="text"
                value={settings.general?.name ?? ''}
                onChange={(e) => handleChange('general', 'name', e.target.value)}
                placeholder="My Store"
              />
            </div>
            <div className="settings-form-row">
              <label htmlFor="settings-support-email">Support email</label>
              <input
                id="settings-support-email"
                type="email"
                value={settings.general?.supportEmail ?? ''}
                onChange={(e) => handleChange('general', 'supportEmail', e.target.value)}
                placeholder="support@example.com"
              />
            </div>
            <div className="settings-form-row">
              <label htmlFor="settings-support-phone">Support phone</label>
              <input
                id="settings-support-phone"
                type="tel"
                value={settings.general?.supportPhone ?? ''}
                onChange={(e) => handleChange('general', 'supportPhone', e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
          </section>

          <section className="settings-section-card">
            <h2>Checkout & payments</h2>
            <p className="section-desc">Order minimums and payment options.</p>
            <div className="settings-form-row">
              <label htmlFor="settings-min-order">Minimum order total (JMD)</label>
              <input
                id="settings-min-order"
                type="number"
                min="0"
                step="1"
                value={settings.checkout?.minOrderTotal ?? ''}
                onChange={(e) =>
                  handleChange('checkout', 'minOrderTotal', e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="0"
              />
            </div>
            <div className="settings-form-row checkbox-row">
              <input
                id="settings-cod"
                type="checkbox"
                checked={!!settings.checkout?.codEnabled}
                onChange={(e) => handleChange('checkout', 'codEnabled', e.target.checked)}
              />
              <label htmlFor="settings-cod">Enable cash on delivery</label>
            </div>
          </section>

          <section className="settings-section-card">
            <h2>Loyalty defaults</h2>
            <p className="section-desc">Points earning rate.</p>
            <div className="settings-form-row">
              <label htmlFor="settings-earn-rate">Points per JMD</label>
              <input
                id="settings-earn-rate"
                type="number"
                min="0"
                step="0.01"
                value={settings.loyalty?.earnRatePerDollar ?? ''}
                onChange={(e) =>
                  handleChange(
                    'loyalty',
                    'earnRatePerDollar',
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                placeholder="0.1"
              />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
