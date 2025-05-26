import MuiModal from "../../Modals/MuiModal";
const GroupDeleteNotice = ({ onClose, data }) => {

  return (
    <MuiModal
      open={true}
      onClose={() => onClose()}
      title={"Notice!"}
      cancelButtonName={"Ok"}
      hideSubmit
    >
      <div className={"flex flex-col items-center gap-[1rem]"}>
        <p className={"text-center"}>
          This group cannot be deleted because it is linked to {data} bundles.
          Please unlink them before proceeding
        </p>
      </div>
    </MuiModal>
  );
};

export default GroupDeleteNotice;
