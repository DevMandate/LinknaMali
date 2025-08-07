import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

const CustomSelect = ({ id, name, label, value, onChange, options, required }) => {
    return (
        <FormControl fullWidth required={required}
            sx={{
                '& .MuiInputLabel-root': { color: 'var(--MUI-input)' },
                '& .MuiSvgIcon-root': { fill: 'var(--text)' },
                '& .MuiOutlinedInput-input': { color: 'var(--text)' },
                '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'var(--merime-theme)' },
                    '&:hover fieldset': { borderColor: 'var(--merime-theme)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--merime-theme)' },
                }
            }}
        >
            <InputLabel>{label}</InputLabel>
            <Select id={id} label={label} name={name} value={value} onChange={onChange}>
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default CustomSelect;