import { Button, Card, Typography, IconButton } from "@mui/material";
import UploadIcon from "@mui/icons-material/CloudUpload";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoIcon from "@mui/icons-material/Info";

const PreviewIcons = () => {
  return (
    <Card className="p-6 shadow-lg">
      <Typography variant="h4" className="text-primary font-bold mb-4">
        Icon Preview 🚀
      </Typography>

      {/* Buttons with Icons */}
      <Typography variant="h6" className="mb-2">
        Buttons with Icons
      </Typography>
      <div className="flex gap-4">
        <Button variant="contained" color="primary" startIcon={<UploadIcon />}>
          Upload
        </Button>
        <Button
          variant="contained"
          color="secondary"
          endIcon={<SettingsIcon />}
        >
          Settings
        </Button>
      </div>

      {/* Outlined Buttons with Icons */}
      <Typography variant="h6" className="mt-6 mb-2">
        Outlined Buttons with Icons
      </Typography>
      <div className="flex gap-4">
        <Button variant="outlined" color="primary" startIcon={<HomeIcon />}>
          Home
        </Button>
        <Button variant="outlined" color="secondary" endIcon={<InfoIcon />}>
          About
        </Button>
      </div>

      {/* Standalone Icon Buttons */}
      <Typography variant="h6" className="mt-6 mb-2">
        Standalone Icons
      </Typography>
      <div className="flex gap-4">
        <IconButton color="primary">
          <UploadIcon />
        </IconButton>
        <IconButton color="secondary">
          <SettingsIcon />
        </IconButton>
      </div>
    </Card>
  );
};

export default PreviewIcons;
