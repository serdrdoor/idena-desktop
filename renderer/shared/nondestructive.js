import React from 'react'
import PropTypes from 'prop-types'

function HideDestructiveElements({children}) {
  return <>{global.allowOLOLOActions && children}</>
}

HideDestructiveElements.propTypes = {
  children: PropTypes.node,
}

export default HideDestructiveElements
