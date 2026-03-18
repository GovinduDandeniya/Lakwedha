import React, { useState } from 'react';
import {
    Box, Typography, TextField, InputAdornment, Button, Chip,
    CircularProgress, Avatar, Dialog, DialogTitle, DialogContent,
    List, ListItemButton, ListItemText, IconButton, Divider,
    Paper, Stack, Fade,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../services/api';

const PRIMARY = '#2E7D32';
const BG = '#F4FAF4';

const SPECIALTIES = [
    'Kayachikitsa (General Ayurveda)',
    'Shalya Tantra (Ayurveda Surgery)',
    'Kshara Sutra (Para-Surgical)',
    'Shalakya Tantra (ENT & Eye)',
    'Netra Roga (Eye Diseases)',
    'Karna Roga (Ear Diseases)',
    'Nasa Roga (Nose Diseases)',
    'Kaumarbhritya / Bala Roga (Pediatrics)',
    'Stri Roga (Gynecology)',
    'Prasuti Tantra (Obstetrics)',
    'Agada Tantra (Toxicology)',
    'Snake Bite Treatment',
    'Bhuta Vidya (Mental Health)',
    'Rasayana Therapy (Rejuvenation)',
    'Anti-Aging Ayurveda',
    'Vajikarana (Fertility & Sexual Health)',
    'Panchakarma (Detox Therapy)',
    'Sandhi Roga (Joint Diseases)',
    'Arthritis Treatment',
    'Orthopedic Ayurveda',
    'Fracture Treatment (Traditional Bone Setter)',
    'Paralysis Treatment',
    'Neurological Disorder Treatment',
    'Twak Roga (Skin Diseases)',
    'Ayurveda Dermatology',
    'Hair Loss Treatment',
    'Ayurveda Cosmetics',
    'Diabetes Ayurveda',
    'Obesity & Weight Loss',
    'Digestive Disorder Treatment',
    'Liver Disease Treatment',
    'Asthma & Respiratory Treatment',
    'Abhyanga Therapy',
    'Shirodhara Therapy',
    'Nasya Therapy',
    'Vasti Therapy',
    'Herbal Medicine',
].sort();

// Group specialties alphabetically
function groupByLetter(list) {
    const map = {};
    list.forEach((s) => {
        const letter = s[0].toUpperCase();
        if (!map[letter]) map[letter] = [];
        map[letter].push(s);
    });
    return map;
}

function DoctorCard({ doctor, onBook, buttonLabel }) {
    const initials = doctor.name ? doctor.name[0].toUpperCase() : 'D';

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid #EEF2EE',
                mb: 2,
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.10)' },
            }}
        >
            {/* Green gradient top strip */}
            <Box sx={{
                height: 4,
                background: `linear-gradient(90deg, ${PRIMARY}, #66BB6A)`,
            }} />

            <Box sx={{ p: 2 }}>
                {/* Top row: avatar + info + fee */}
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar
                        src={doctor.profileImage || undefined}
                        sx={{
                            width: 56, height: 56,
                            bgcolor: '#C8E6C9',
                            color: PRIMARY,
                            fontWeight: 700,
                            fontSize: 22,
                            flexShrink: 0,
                        }}
                    >
                        {initials}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography fontWeight={700} fontSize={15} noWrap color="#1A1A2E">
                                {doctor.name}
                            </Typography>
                            {doctor.isVerified && (
                                <VerifiedRoundedIcon sx={{ fontSize: 16, color: PRIMARY }} />
                            )}
                        </Stack>
                        <Typography fontSize={12} fontWeight={600} color={PRIMARY}>
                            {doctor.specialization}
                        </Typography>
                        {doctor.qualification && (
                            <Typography fontSize={11} color="text.secondary" noWrap>
                                {doctor.qualification}
                            </Typography>
                        )}
                        <Stack direction="row" spacing={0.75} mt={0.75} flexWrap="wrap">
                            {doctor.experience > 0 && (
                                <Chip
                                    label={`${doctor.experience} yrs exp`}
                                    size="small"
                                    sx={{
                                        height: 20, fontSize: 10, fontWeight: 600,
                                        bgcolor: '#E3F2FD', color: '#1565C0',
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                            )}
                            {doctor.isVerified && (
                                <Chip
                                    label="Verified"
                                    size="small"
                                    sx={{
                                        height: 20, fontSize: 10, fontWeight: 600,
                                        bgcolor: '#E8F5E9', color: PRIMARY,
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                            )}
                        </Stack>
                    </Box>

                    {/* Fee badge */}
                    <Box sx={{
                        px: 1.5, py: 1,
                        background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
                        borderRadius: 2,
                        textAlign: 'center',
                        flexShrink: 0,
                    }}>
                        <Typography fontSize={9} color="text.secondary" fontWeight={500}>LKR</Typography>
                        <Typography fontSize={15} fontWeight={700} color={PRIMARY} lineHeight={1.2}>
                            {Math.round(doctor.consultationFee)}
                        </Typography>
                    </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                {/* Bottom row: clinic + book button */}
                <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <LocalHospitalOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                            <Typography fontSize={12} fontWeight={600} color="#1A1A2E" noWrap>
                                {doctor.clinicName}
                            </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5} mt={0.25}>
                            <LocationOnOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography fontSize={11} color="text.secondary" noWrap>
                                {doctor.clinicAddress}
                            </Typography>
                        </Stack>
                    </Box>

                    <Button
                        variant="contained"
                        size="small"
                        onClick={onBook}
                        sx={{
                            bgcolor: PRIMARY,
                            '&:hover': { bgcolor: '#1B5E20' },
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: 13,
                            px: 2,
                            py: 0.75,
                            flexShrink: 0,
                            boxShadow: 'none',
                        }}
                    >
                        {buttonLabel || 'Book Now'}
                    </Button>
                </Stack>
            </Box>
        </Paper>
    );
}

function SpecialtyDialog({ open, selected, onSelect, onClose }) {
    const [search, setSearch] = useState('');
    const filtered = SPECIALTIES.filter((s) =>
        s.toLowerCase().includes(search.toLowerCase())
    );
    const grouped = groupByLetter(filtered);
    const letters = Object.keys(grouped).sort();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '70vh' } }}
        >
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography fontWeight={700} fontSize={17}>Specialization</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    {selected && (
                        <Button size="small" sx={{ color: 'error.main', textTransform: 'none', minWidth: 0, p: 0 }}
                            onClick={() => { onSelect(null); onClose(); }}>
                            Clear
                        </Button>
                    )}
                    <IconButton size="small" onClick={onClose}><CloseRoundedIcon fontSize="small" /></IconButton>
                </Stack>
            </DialogTitle>

            <Box sx={{ px: 3, pb: 1 }}>
                <TextField
                    fullWidth size="small" placeholder="Search..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: 2, bgcolor: '#F5F5F5', fontSize: 14 },
                    }}
                    sx={{ '& fieldset': { border: 'none' } }}
                />
            </Box>

            <DialogContent sx={{ pt: 0.5, px: 2 }}>
                <List dense disablePadding>
                    {letters.map((letter) => (
                        <Box key={letter}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: PRIMARY, letterSpacing: 1.4, px: 1.5, pt: 1.5, pb: 0.5 }}>
                                {letter}
                            </Typography>
                            {grouped[letter].map((spec) => {
                                const isSelected = selected === spec;
                                return (
                                    <ListItemButton
                                        key={spec}
                                        selected={isSelected}
                                        onClick={() => { onSelect(isSelected ? null : spec); onClose(); }}
                                        sx={{
                                            borderRadius: 2,
                                            mb: 0.25,
                                            bgcolor: isSelected ? '#E8F5E9 !important' : undefined,
                                        }}
                                    >
                                        <ListItemText
                                            primary={spec}
                                            primaryTypographyProps={{
                                                fontSize: 13,
                                                fontWeight: isSelected ? 600 : 400,
                                                color: isSelected ? PRIMARY : '#1A1A2E',
                                            }}
                                        />
                                        {isSelected && (
                                            <VerifiedRoundedIcon sx={{ fontSize: 16, color: PRIMARY }} />
                                        )}
                                    </ListItemButton>
                                );
                            })}
                        </Box>
                    ))}
                </List>
            </DialogContent>
        </Dialog>
    );
}

export default function DoctorChanellingSearchPage() {
    const [name, setName] = useState('');
    const [hospital, setHospital] = useState('');
    const [specialty, setSpecialty] = useState(null);
    const [date, setDate] = useState(null);
    const [specDialogOpen, setSpecDialogOpen] = useState(false);

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const hasFilters = name || hospital || specialty || date;

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = {};
            if (specialty) params.specialty = specialty;
            if (hospital.trim()) params.location = hospital.trim();

            const res = await api.get('/doctors', { params });
            const data = res.data?.data ?? res.data?.doctors ?? [];
            setDoctors(Array.isArray(data) ? data : []);
        } catch {
            setDoctors([]);
        } finally {
            setLoading(false);
            setHasSearched(true);
        }
    };

    const handleClear = () => {
        setName('');
        setHospital('');
        setSpecialty(null);
        setDate(null);
        setDoctors([]);
        setHasSearched(false);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ minHeight: '100vh', bgcolor: BG, p: { xs: 2, md: 3 } }}>
                {/* Page header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" fontWeight={800} color={PRIMARY} letterSpacing={-0.5}>
                        Doctor Channelling Search
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Search for doctors by name, hospital, or specialization
                    </Typography>
                </Box>

                {/* Search panel */}
                <Paper elevation={0} sx={{
                    p: 2.5, borderRadius: 3, mb: 2,
                    border: '1px solid #E8EDF2',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.07)',
                }}>
                    <Stack spacing={1.5}>
                        {/* Doctor name */}
                        <TextField
                            fullWidth size="small" placeholder="Doctor name"
                            value={name} onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonSearchOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2, bgcolor: '#F8F8F8', fontSize: 14 },
                            }}
                        />

                        {/* Hospital */}
                        <TextField
                            fullWidth size="small" placeholder="Hospital or clinic"
                            value={hospital} onChange={(e) => setHospital(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LocalHospitalOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2, bgcolor: '#F8F8F8', fontSize: 14 },
                            }}
                        />

                        {/* Specialty + Date */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            {/* Specialty picker */}
                            <Box
                                onClick={() => setSpecDialogOpen(true)}
                                sx={{
                                    flex: 1,
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    px: 1.5, py: 1,
                                    borderRadius: 2,
                                    border: `1px solid ${specialty ? `${PRIMARY}80` : '#E0E0E0'}`,
                                    bgcolor: specialty ? '#E8F5E9' : '#F8F8F8',
                                    cursor: 'pointer',
                                    minHeight: 40,
                                }}
                            >
                                <MedicalServicesOutlinedIcon
                                    fontSize="small"
                                    sx={{ color: specialty ? PRIMARY : 'text.disabled', flexShrink: 0 }}
                                />
                                <Typography
                                    fontSize={13}
                                    color={specialty ? PRIMARY : 'text.disabled'}
                                    fontWeight={specialty ? 500 : 400}
                                    noWrap sx={{ flex: 1 }}
                                >
                                    {specialty || 'Specialization'}
                                </Typography>
                            </Box>

                            {/* Date picker */}
                            <DatePicker
                                value={date}
                                onChange={setDate}
                                disablePast
                                maxDate={dayjs().add(90, 'day')}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        placeholder: 'Any date',
                                        InputProps: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarTodayOutlinedIcon fontSize="small" sx={{ color: date ? PRIMARY : 'text.disabled' }} />
                                                </InputAdornment>
                                            ),
                                            sx: {
                                                borderRadius: 2,
                                                bgcolor: date ? '#E8F5E9' : '#F8F8F8',
                                                fontSize: 13,
                                                color: date ? PRIMARY : undefined,
                                            },
                                        },
                                        sx: { flex: 1, minWidth: 160 },
                                    },
                                }}
                            />
                        </Stack>

                        {/* Buttons */}
                        <Stack direction="row" spacing={1}>
                            <Button
                                fullWidth variant="contained"
                                startIcon={<SearchIcon />}
                                onClick={handleSearch}
                                sx={{
                                    bgcolor: PRIMARY, '&:hover': { bgcolor: '#1B5E20' },
                                    borderRadius: 2, textTransform: 'none',
                                    fontWeight: 600, py: 1.2, boxShadow: 'none',
                                }}
                            >
                                Search
                            </Button>
                            {hasFilters && (
                                <Button
                                    variant="outlined"
                                    onClick={handleClear}
                                    sx={{
                                        borderRadius: 2, borderColor: '#E0E0E0',
                                        color: 'text.secondary', textTransform: 'none',
                                        px: 2, py: 1.2, minWidth: 'auto',
                                        '&:hover': { borderColor: '#ccc', bgcolor: '#F5F5F5' },
                                    }}
                                >
                                    <CloseRoundedIcon fontSize="small" />
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </Paper>

                {/* Results count */}
                {hasSearched && !loading && (
                    <Typography fontSize={13} color="text.secondary" fontWeight={500} mb={1} px={0.5}>
                        {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
                    </Typography>
                )}

                {/* Content area */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
                        <CircularProgress sx={{ color: PRIMARY }} thickness={2.5} />
                    </Box>
                ) : !hasSearched ? (
                    <Fade in>
                        <Box sx={{ textAlign: 'center', pt: 8 }}>
                            <Box sx={{
                                width: 88, height: 88, borderRadius: '50%',
                                bgcolor: '#E8F5E9', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 2.5,
                            }}>
                                <SearchIcon sx={{ fontSize: 44, color: PRIMARY }} />
                            </Box>
                            <Typography fontSize={18} fontWeight={700} color="#1A1A2E" mb={1}>
                                Find your doctor
                            </Typography>
                            <Typography fontSize={14} color="text.secondary" lineHeight={1.6}>
                                Use the filters above to search<br />by name, hospital or specialization.
                            </Typography>
                        </Box>
                    </Fade>
                ) : doctors.length === 0 ? (
                    <Fade in>
                        <Box sx={{ textAlign: 'center', pt: 8 }}>
                            <Box sx={{
                                width: 88, height: 88, borderRadius: '50%',
                                bgcolor: '#F5F5F5', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 2.5,
                            }}>
                                <SearchOffRoundedIcon sx={{ fontSize: 44, color: '#BDBDBD' }} />
                            </Box>
                            <Typography fontSize={18} fontWeight={700} color="#757575" mb={1}>
                                No doctors found
                            </Typography>
                            <Typography fontSize={14} color="text.secondary" lineHeight={1.6} mb={3.5}>
                                Try clearing filters or searching<br />with a different term.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshRoundedIcon />}
                                onClick={handleClear}
                                sx={{
                                    borderRadius: 2, borderColor: PRIMARY,
                                    color: PRIMARY, textTransform: 'none',
                                    fontWeight: 600, px: 2.5, py: 1,
                                }}
                            >
                                Clear filters
                            </Button>
                        </Box>
                    </Fade>
                ) : (
                    <Fade in>
                        <Box>
                            {doctors.map((doc) => (
                                <DoctorCard
                                    key={doc._id || doc.id}
                                    doctor={doc}
                                    buttonLabel="View & Book"
                                    onBook={() => {
                                        // Navigate to booking or availability
                                        console.log('Book doctor', doc._id || doc.id);
                                    }}
                                />
                            ))}
                        </Box>
                    </Fade>
                )}

                {/* Specialty picker dialog */}
                <SpecialtyDialog
                    open={specDialogOpen}
                    selected={specialty}
                    onSelect={setSpecialty}
                    onClose={() => setSpecDialogOpen(false)}
                />
            </Box>
        </LocalizationProvider>
    );
}
