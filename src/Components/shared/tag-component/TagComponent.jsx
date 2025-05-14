import { Chip } from '@mui/material'
import React from 'react'


const colorsMap = {
    success:"success",
    pending : "warning",
    error : "error", //i don't know the status yet should ask samah,
    failed : 'error',
}
const TagComponent = ({value="pending"}) => {
  return (
    <Chip label={value} color={colorsMap?.[value] || "warning"} variant="filled"/>
  )
}

export default TagComponent