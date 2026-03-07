'use client'

import {
  DrivePicker,
  DrivePickerDocsView,
} from "@googleworkspace/drive-picker-react";

export default function PickerButton({ title, onPicked, onCanceled }) {

  return (
    <DrivePicker
      client-id={process.env.NEXT_PUBLIC_AUTH_GOOGLE_CLIENT_ID}
      app-id={process.env.NEXT_PUBLIC_GOOGLE_APP_ID}
      scope="https://www.googleapis.com/auth/drive.file"
      onPicked={onPicked}
      onCanceled={onCanceled}
      title={title}

    >
      <DrivePickerDocsView
        include-folders="true"
        select-folder-enabled="true"
        starred={true}
        view-id="FOLDERS"
        parent="root"
      />
    </DrivePicker>
  )
}