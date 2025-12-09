import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
//COMPONENT
import { Close } from "@mui/icons-material";
import { Button, Dialog, DialogContent, IconButton } from "@mui/material";
import { updateBundleTitle } from "../../../core/apis/bundlesAPI";
import { FormInput } from "../../form-component/FormComponent";

const schema = yup.object().shape({
  bundle_name: yup
    .string()
    .label("Name")
    .max(100)
    .required()
    .nullable()
    .test(
      "not-only-spaces",
      "Name cannot be only spaces",
      (value) => value == null || value.trim().length > 0
    ),
});

const UpdateBundleName = ({ onClose, data, refetchData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      bundle_name: "",
    },
    resolver: yupResolver(schema),
    mode: "all",
  });

  const handleSubmitForm = (payload) => {
    setIsSubmitting(true);
    updateBundleTitle({ ...payload, id: data?.id })
      .then((res) => {
        if (res?.error) {
          toast.error(res?.error);
        } else {
          refetchData();
          onClose();
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  useEffect(() => {
    if (data) {
      reset({ bundle_name: data?.bundle_name });
    }
  }, [data, reset]);
  return (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogContent className="flex flex-col gap-[1rem] xs:!px-8 !py-10 ">
        <div className={"flex flex-row justify-end"}>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={() => ({
              position: "absolute",
              right: 8,
              top: 8,
              color: "black",
            })}
          >
            <Close />
          </IconButton>
        </div>
        <form
          className={"flex flex-col gap-[1rem] "}
          onSubmit={handleSubmit(handleSubmitForm)}
        >
          <h1 className={"text-center"}>{"Update Bundle Display Name"}</h1>
          <div className="label-input-wrapper">
            <Controller
              name="bundle_name"
              control={control}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <label className="w-full">
                  Display Name*
                  <FormInput
                    placeholder="Enter display name"
                    value={value}
                    helperText={error?.message}
                    onChange={(val) => onChange(val)}
                  />
                </label>
              )}
            />
          </div>

          <div className={"w-full flex flex-row justify-between gap-[1rem]"}>
            <Button
              variant={"contained"}
              sx={{ width: "100%" }}
              color="secondary"
              onClick={() => onClose()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              variant={"contained"}
              sx={{ width: "100%" }}
              color="primary"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBundleName;
