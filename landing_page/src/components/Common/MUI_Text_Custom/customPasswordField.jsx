import { useState } from "react";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const CustomPasswordField = ({ id, name, label, value, onChange, required }) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <TextField
            fullWidth
            required={required}
            id={id}
            name={name}
            label={label}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            variant="outlined"
            sx={{
                "& .MuiInputLabel-root": { color: "var(--MUI-input)" },
                '& .MuiOutlinedInput-input ,': {
                    color: 'var(--text)',
                },
                "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "var(--merime-theme)" },
                    "&:hover fieldset": { borderColor: "var(--merime-theme)" },
                    "&.Mui-focused fieldset": { borderColor: "var(--merime-theme)" },
                },
            }}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={togglePasswordVisibility} edge="end">
                                {showPassword ? (
                                    <VisibilityOff sx={{ color: "var(--text)" }} />
                                ) : (
                                    <Visibility sx={{ color: "var(--text)" }} />
                                )}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
};

export default CustomPasswordField;
