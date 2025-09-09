import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Card, CardContent, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import * as Yup from "yup";
import { FormPassword } from "../../Components/form-component/FormComponent";
import supabase from "../../core/apis/supabase";
import { toast } from "react-toastify";
import { useState } from "react";

// Regex: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

const validationSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .matches(passwordRegex, "Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character")
    .required("New password is required"),
  verifyPassword: Yup.string()
    .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
    .required("Please confirm your new password"),
});

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      verifyPassword: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const handleChangePassword = async (data) => {
    setLoading(true);
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.email) throw new Error("User not found");

      // Optional: Re-authenticate (not required by Supabase, but you can check password validity)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: data.currentPassword,
      });
      if (signInError) throw new Error("Current password is incorrect");

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (error) throw error;

      toast.success("Password changed successfully!");
      reset();
    } catch (e) {
      toast.error(e.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
      <Card sx={{ maxWidth: "400px" }}>
        <CardContent className="flex flex-col gap-[0.5rem]">
          <Typography variant="h5" gutterBottom align="center">
            Change Password
          </Typography>
          <form className="flex flex-col gap-[1rem]" onSubmit={handleSubmit(handleChangePassword)}>
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                Current Password
              </label>
              <Controller
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <FormPassword
                    placeholder="Enter current password"
                    value={value}
                    helperText={error?.message}
                    onChange={onChange}
                  />
                )}
                name="currentPassword"
                control={control}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                New Password
              </label>
              <Controller
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <FormPassword
                    placeholder="Enter new password"
                    value={value}
                    helperText={error?.message}
                    onChange={onChange}
                  />
                )}
                name="newPassword"
                control={control}
              />
            </div>
            <div>
              <label htmlFor="verifyPassword" className="block text-sm font-medium mb-2">
                Verify New Password
              </label>
              <Controller
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <FormPassword
                    placeholder="Re-enter new password"
                    value={value}
                    helperText={error?.message}
                    onChange={onChange}
                  />
                )}
                name="verifyPassword"
                control={control}
              />
            </div>
            <Button variant="contained" color="primary" type="submit" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}