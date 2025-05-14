import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Lock as LockIcon,
  Person,
} from "@mui/icons-material";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";
import PersonIcon from "@mui/icons-material/Person";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useFormik } from "formik";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import supabase from "../../core/apis/supabase";
import { toggleTheme } from "../../core/helpers/utilFunctions";
import {
  FormInput,
  FormPassword,
} from "../../Components/form-component/FormComponent";
import { toast } from "react-toastify";
import { SignIn } from "../../Redux/reducers/AuthReducer";

const validationSchema = Yup.object({
  email: Yup.string().required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function SignInPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const dispatch = useDispatch();

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const handleSubmitForm = async (payload) => {
    setLoading(true);

    await supabase.auth
      .signInWithPassword({
        email: payload.email,
        password: payload.password,
      })
      .then((res) => {
        console.log(res, "resss");
        if (res?.error) {
          toast.error(res?.error?.message || "Failed to Sign in");
          console.error("Error fetching data:", res?.error?.code);
        } else {
          dispatch(
            SignIn({
              token: res.data.session.access_token,
            })
          );
          navigate("/users");
        }
      })
      .catch((e) => {
        toast.error(e?.message || "Failed to Sign in");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div
      className={"flex items-center justify-center min-h-[calc(100vh-180px)]"}
    >
      <Card sx={{ maxWidth: "400px" }}>
        <CardContent className={"flex flex-col gap-[0.5rem]"}>
          <Typography variant="h4" gutterBottom align="center">
            Sign In
          </Typography>
          <form
            className="flex flex-col gap-[1rem]"
            onSubmit={handleSubmit(handleSubmitForm)}
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormInput
                    placeholder={"Enter email"}
                    value={value}
                    helperText={error?.message}
                    onChange={(value) => onChange(value)}
                    startAdornment={<Person />}
                  />
                )}
                name="email"
                control={control}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormPassword
                    placeholder={"Enter password"}
                    value={value}
                    helperText={error?.message}
                    onChange={(value) => onChange(value)}
                    startAdornment={<LockIcon />}
                  />
                )}
                name="password"
                control={control}
              />
            </div>
            <Button
              variant={"contained"}
              color="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Loading..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
