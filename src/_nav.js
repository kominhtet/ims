import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilExternalLink,
  cilNotes,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
  cilSettings,
  cilList
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
  }, 
  {
    component: CNavItem,
    name: 'Category',
    to: '/category',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
    
  }, 
  {
    component: CNavItem,
    name: 'Settings',
    to: '/settings',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
    
  }, 
]

export default _nav
