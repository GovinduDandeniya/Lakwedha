import React from 'react';
import { Box, Typography, Avatar, Chip, Grid, Divider } from '@mui/material';
import { Email, LocalHospital, Person, Star, Verified } from '@mui/icons-material';
import { AYURVEDA_SPECIALIZATIONS } from '../../utils/constants';

const InfoItem = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
        <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            bgcolor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
            {React.cloneElement(icon, { sx: { color: '#2E7D32', fontSize: 18 } })}
        </Box>
        <Box>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
        </Box>
    </Box>
);

const DoctorProfile = ({ user }) => {
    return (
        <Box>
            {/* Avatar & Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#2E7D32', fontSize: 30, fontWeight: 700 }}>
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
                </Avatar>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h5" fontWeight={800}>{user?.name || 'Doctor'}</Typography>
                        {user?.status === 'APPROVED' && (
                            <Chip
                                icon={<Verified sx={{ fontSize: '14px !important' }} />}
                                label="Verified"
                                size="small"
                                sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 700, fontSize: 11 }}
                            />
                        )}
                    </Box>
                    <Chip
                        icon={<Star sx={{ fontSize: '14px !important' }} />}
                        label={
                            AYURVEDA_SPECIALIZATIONS.includes(user?.specialization)
                                ? user.specialization
                                : (user?.specialization || 'Kayachikitsa (General Ayurveda)')
                        }
                        size="small"
                        sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, mt: 0.5 }}
                    />
                </Box>
            </Box>
            <Divider sx={{ mb: 2.5 }} />
            <InfoItem icon={<Person />}       label="Full Name"       value={user?.name} />
            <InfoItem icon={<Email />}        label="Email Address"   value={user?.email} />
            <InfoItem icon={<LocalHospital />} label="Specialization"  value={user?.specialization} />
            <InfoItem icon={<Star />}         label="Role"            value="Registered Doctor" />
        </Box>
    );
};

export default DoctorProfile;
