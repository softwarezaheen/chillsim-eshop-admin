import { Button, Card, Typography } from "@mui/material";

const PreviewButtons = () => {
  return (
    <Card className="p-6 shadow-lg">
      <Typography variant="h4" className="text-primary font-bold mb-4">
        Button Preview 🚀
      </Typography>

      {/* Contained Buttons */}
      <Typography variant="h6" className="mb-2">
        Contained Buttons
      </Typography>
      <div className="flex gap-4">
        <Button variant="contained" color="primary">
          Primary Button
        </Button>
        <Button variant="contained" color="secondary">
          Secondary Button
        </Button>
      </div>

      {/* Outlined Buttons */}
      <Typography variant="h6" className="mt-6 mb-2">
        Outlined Buttons
      </Typography>
      <div className="flex gap-4">
        <Button variant="outlined" color="primary">
          Outlined Primary
        </Button>
        <Button variant="outlined" color="secondary">
          Outlined Secondary
        </Button>
      </div>

      {/* Text Buttons */}
      <Typography variant="h6" className="mt-6 mb-2">
        Text Buttons
      </Typography>
      <div className="flex gap-4">
        <Button variant="text" color="primary">
          Text Primary
        </Button>
        <Button variant="text" color="secondary">
          Text Secondary
        </Button>
      </div>
    </Card>
  );
};

export default PreviewButtons;
