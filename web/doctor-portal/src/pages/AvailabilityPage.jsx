import { useState, useEffect, useCallback, cloneElement } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton,
  Divider, CircularProgress, Tooltip, Card, CardContent,
} from '@mui/material';
import {
  Add, CalendarMonth, EventAvailable, Cancel, Edit, Close,
  ChevronLeft, ChevronRight, CheckCircle, Pending, Block,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../services/api';
import { toast } from 'react-toastify';

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  open:      { label: 'Open',      color: 'success' },
  full:      { label: 'Full',      color: 'warning' },
  closed:    { label: 'Closed',    color: 'default' },
  completed: { label: 'Completed', color: 'info'    },
  cancelled: { label: 'Cancelled', color: 'error'   },
};

const HOSPITALS = [
  'Lakwedha Ayurveda Hospital - Colombo',
  'Lakwedha Ayurveda Hospital - Kandy',
  'Lakwedha Ayurveda Hospital - Galle',
  'Lakwedha Wellness Center - Negombo',
];

const EMPTY_FORM = {
  hospitalName: '',
  date: '',
  startTime: '',
  totalAppointments: '',
  note: '',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, color }) {
  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
        <Box
          sx={{
            width: 48, height: 48, borderRadius: 2,
            bgcolor: `${color}.light`, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {cloneElement(icon, { sx: { color: `${color}.dark`, fontSize: 24 } })}
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

function SessionCard({ session, onEdit, onCancel, onClose }) {
  const canEdit   = session.status === 'open' || session.status === 'full';
  const canCancel = session.status === 'open' || session.status === 'full';
  const canClose  = session.status === 'open';

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2, borderRadius: 3,
        borderLeft: `4px solid`,
        borderLeftColor:
          session.status === 'open'      ? 'success.main' :
          session.status === 'full'      ? 'warning.main' :
          session.status === 'cancelled' ? 'error.main'   : 'grey.400',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{session.hospitalName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {dayjs(session.date).format('dddd, DD MMM YYYY')} &nbsp;·&nbsp; {session.startTime}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Appointments: <strong>{session.bookedCount}/{session.totalAppointments}</strong>
          </Typography>
          {session.note && (
            <Typography variant="caption" color="text.secondary">{session.note}</Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <StatusChip status={session.status} />
          {canEdit && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(session)}><Edit fontSize="small" /></IconButton>
            </Tooltip>
          )}
          {canClose && (
            <Tooltip title="Close Booking">
              <IconButton size="small" onClick={() => onClose(session)}><Block fontSize="small" /></IconButton>
            </Tooltip>
          )}
          {canCancel && (
            <Tooltip title="Cancel Session">
              <IconButton size="small" color="error" onClick={() => onCancel(session)}><Cancel fontSize="small" /></IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

function CalendarView({ sessions, selectedMonth, onMonthChange, onDayClick }) {
  const start = selectedMonth.startOf('month').startOf('week');
  const end   = selectedMonth.endOf('month').endOf('week');

  const days = [];
  let cur = start;
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    days.push(cur);
    cur = cur.add(1, 'day');
  }

  const sessionsByDate = {};
  sessions.forEach(s => {
    const key = dayjs(s.date).format('YYYY-MM-DD');
    if (!sessionsByDate[key]) sessionsByDate[key] = [];
    sessionsByDate[key].push(s);
  });

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <IconButton size="small" onClick={() => onMonthChange(selectedMonth.subtract(1, 'month'))}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={700}>
          {selectedMonth.format('MMMM YYYY')}
        </Typography>
        <IconButton size="small" onClick={() => onMonthChange(selectedMonth.add(1, 'month'))}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Day labels */}
      <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <Grid item key={d} xs={12 / 7}>
            <Typography align="center" variant="caption" color="text.secondary" fontWeight={600}>
              {d}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Days grid */}
      <Grid container spacing={0.5}>
        {days.map(day => {
          const key      = day.format('YYYY-MM-DD');
          const daySessions = sessionsByDate[key] || [];
          const isToday  = key === today;
          const isCurrentMonth = day.month() === selectedMonth.month();

          return (
            <Grid item key={key} xs={12 / 7}>
              <Box
                onClick={() => daySessions.length > 0 && onDayClick(day, daySessions)}
                sx={{
                  minHeight: 48,
                  p: 0.5,
                  borderRadius: 1.5,
                  cursor: daySessions.length > 0 ? 'pointer' : 'default',
                  bgcolor: isToday ? 'primary.light' : 'transparent',
                  opacity: isCurrentMonth ? 1 : 0.35,
                  '&:hover': daySessions.length > 0 ? { bgcolor: 'action.hover' } : {},
                  border: isToday ? '2px solid' : '2px solid transparent',
                  borderColor: isToday ? 'primary.main' : 'transparent',
                }}
              >
                <Typography
                  align="center"
                  variant="caption"
                  fontWeight={isToday ? 700 : 400}
                  color={isToday ? 'primary.dark' : 'text.primary'}
                >
                  {day.date()}
                </Typography>
                {daySessions.slice(0, 2).map((s, i) => (
                  <Box
                    key={i}
                    sx={{
                      height: 4, borderRadius: 1, mt: 0.3,
                      bgcolor:
                        s.status === 'open'      ? 'success.main' :
                        s.status === 'full'      ? 'warning.main' :
                        s.status === 'cancelled' ? 'error.main'   : 'grey.400',
                    }}
                  />
                ))}
                {daySessions.length > 2 && (
                  <Typography align="center" variant="caption" color="text.secondary">
                    +{daySessions.length - 2}
                  </Typography>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const [sessions, setSessions]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [statusFilter, setStatusFilter]   = useState('all');

  // dialogs
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type, session }
  const [dayDialog, setDayDialog]     = useState(null);     // { day, sessions }

  // form state
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const todayStr = dayjs().format('YYYY-MM-DD');

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/channeling-sessions');
      setSessions(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ── Summary counts ───────────────────────────────────────────────────────

  const counts = sessions.reduce(
    (acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1, total: acc.total + 1 }),
    { total: 0, open: 0, full: 0, completed: 0, cancelled: 0, closed: 0 },
  );

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = (f) => {
    const e = {};
    if (!f.hospitalName)      e.hospitalName = 'Required';
    if (!f.date)              e.date = 'Required';
    if (f.date < todayStr)    e.date = 'Date cannot be in the past';
    if (!f.startTime)         e.startTime = 'Required';
    if (!f.totalAppointments || Number(f.totalAppointments) < 1)
                              e.totalAppointments = 'Must be ≥ 1';
    return e;
  };

  // ── Release ──────────────────────────────────────────────────────────────

  const handleRelease = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await api.post('/channeling-sessions', {
        ...form,
        totalAppointments: Number(form.totalAppointments),
      });
      toast.success('Session released successfully');
      setReleaseOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      fetchSessions();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to release session');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────

  const openEdit = (session) => {
    setEditTarget(session);
    setForm({
      hospitalName:       session.hospitalName,
      date:               dayjs(session.date).format('YYYY-MM-DD'),
      startTime:          session.startTime,
      totalAppointments:  String(session.totalAppointments),
      note:               session.note || '',
    });
    setErrors({});
    setEditOpen(true);
  };

  const handleEdit = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await api.patch(`/channeling-sessions/${editTarget._id}`, {
        ...form,
        totalAppointments: Number(form.totalAppointments),
      });
      toast.success('Session updated');
      setEditOpen(false);
      setEditTarget(null);
      fetchSessions();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update session');
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel / Close ───────────────────────────────────────────────────────

  const openConfirm = (type, session) => {
    setConfirmAction({ type, session });
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const { type, session } = confirmAction;
    setSaving(true);
    try {
      if (type === 'cancel') {
        const res = await api.patch(`/channeling-sessions/${session._id}/cancel`, {});
        const affected = res?.data?.affectedAppointments ?? 0;
        toast.success(affected > 0
          ? `Session cancelled. ${affected} patient appointment(s) cancelled and notified.`
          : 'Session cancelled.');
      } else {
        await api.patch(`/channeling-sessions/${session._id}/close`, {});
        toast.success('Booking closed');
      }
      setConfirmOpen(false);
      setConfirmAction(null);
      fetchSessions();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered sessions ────────────────────────────────────────────────────

  const filteredSessions = statusFilter === 'all'
    ? sessions
    : sessions.filter(s => s.status === statusFilter);

  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

      {/* Page header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="primary.dark">
            Availability & Sessions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your channeling appointment sessions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setForm(EMPTY_FORM); setErrors({}); setReleaseOpen(true); }}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Release Session
        </Button>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard icon={<EventAvailable />} label="Total Sessions" value={counts.total} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard icon={<CheckCircle />} label="Open" value={counts.open} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard icon={<Pending />} label="Completed" value={counts.completed} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard icon={<Cancel />} label="Cancelled" value={counts.cancelled} color="error" />
        </Grid>
      </Grid>

      {/* Calendar + Sessions list */}
      <Grid container spacing={3}>

        {/* Calendar */}
        <Grid item xs={12} md={5}>
          <CalendarView
            sessions={sessions}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onDayClick={(day, daySessions) => setDayDialog({ day, sessions: daySessions })}
          />
        </Grid>

        {/* Sessions list */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
              <Typography variant="subtitle1" fontWeight={700}>Sessions</Typography>
              <TextField
                select
                size="small"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                sx={{ minWidth: 130 }}
              >
                <MenuItem value="all">All</MenuItem>
                {Object.keys(STATUS_CONFIG).map(s => (
                  <MenuItem key={s} value={s}>{STATUS_CONFIG[s].label}</MenuItem>
                ))}
              </TextField>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={32} />
              </Box>
            ) : sortedSessions.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={5} color="text.secondary">
                <CalendarMonth sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                <Typography variant="body2">No sessions found</Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5} sx={{ maxHeight: 480, overflowY: 'auto', pr: 0.5 }}>
                {sortedSessions.map(s => (
                  <SessionCard
                    key={s._id}
                    session={s}
                    onEdit={openEdit}
                    onCancel={sess => openConfirm('cancel', sess)}
                    onClose={sess => openConfirm('close', sess)}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Release Dialog ── */}
      <Dialog open={releaseOpen} onClose={() => setReleaseOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Release New Session</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select fullWidth label="Hospital" size="small"
                value={form.hospitalName}
                onChange={e => setForm(f => ({ ...f, hospitalName: e.target.value }))}
                error={!!errors.hospitalName} helperText={errors.hospitalName}
              >
                {HOSPITALS.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Date" type="date" size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: todayStr }}
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                error={!!errors.date} helperText={errors.date}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Start Time" type="time" size="small"
                InputLabelProps={{ shrink: true }}
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                error={!!errors.startTime} helperText={errors.startTime}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Total Appointments" type="number" size="small"
                inputProps={{ min: 1 }}
                value={form.totalAppointments}
                onChange={e => setForm(f => ({ ...f, totalAppointments: e.target.value }))}
                error={!!errors.totalAppointments} helperText={errors.totalAppointments}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Note (optional)" size="small"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                inputProps={{ maxLength: 200 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReleaseOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRelease} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Release'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Session</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select fullWidth label="Hospital" size="small"
                value={form.hospitalName}
                onChange={e => setForm(f => ({ ...f, hospitalName: e.target.value }))}
                error={!!errors.hospitalName} helperText={errors.hospitalName}
              >
                {HOSPITALS.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Date" type="date" size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: todayStr }}
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                error={!!errors.date} helperText={errors.date}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Start Time" type="time" size="small"
                InputLabelProps={{ shrink: true }}
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                error={!!errors.startTime} helperText={errors.startTime}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Total Appointments" type="number" size="small"
                inputProps={{ min: editTarget ? editTarget.bookedCount : 1 }}
                value={form.totalAppointments}
                onChange={e => setForm(f => ({ ...f, totalAppointments: e.target.value }))}
                error={!!errors.totalAppointments} helperText={errors.totalAppointments}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Note (optional)" size="small"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                inputProps={{ maxLength: 200 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirm Dialog ── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirmAction?.type === 'cancel' ? 'Cancel Session' : 'Close Booking'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmAction?.type === 'cancel'
              ? 'Are you sure you want to cancel this session? This cannot be undone.'
              : 'Close booking for this session? No new appointments will be accepted.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Back</Button>
          <Button
            variant="contained"
            color={confirmAction?.type === 'cancel' ? 'error' : 'warning'}
            onClick={handleConfirm}
            disabled={saving}
          >
            {saving ? <CircularProgress size={18} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Day Sessions Dialog ── */}
      <Dialog open={!!dayDialog} onClose={() => setDayDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Sessions on {dayDialog && dayDialog.day.format('DD MMM YYYY')}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={1.5}>
            {dayDialog?.sessions.map(s => (
              <SessionCard
                key={s._id}
                session={s}
                onEdit={sess => { setDayDialog(null); openEdit(sess); }}
                onCancel={sess => { setDayDialog(null); openConfirm('cancel', sess); }}
                onClose={sess => { setDayDialog(null); openConfirm('close', sess); }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDayDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
