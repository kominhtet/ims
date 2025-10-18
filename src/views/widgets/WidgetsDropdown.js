import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import {
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CWidgetStatsA,
} from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartBar, CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilArrowBottom, cilArrowTop, cilOptions } from '@coreui/icons'
import { getItems } from 'src/api'

const WidgetsDropdown = (props) => {
  const widgetChartRef1 = useRef(null)
  const widgetChartRef2 = useRef(null)
  const [totalItems, setTotalItems] = useState(0)
  const [totalCategories, setTotalCategories] = useState(0)

  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (widgetChartRef1.current) {
        setTimeout(() => {
          widgetChartRef1.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
          widgetChartRef1.current.update()
        })
      }

      if (widgetChartRef2.current) {
        setTimeout(() => {
          widgetChartRef2.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
          widgetChartRef2.current.update()
        })
      }
    })
  }, [widgetChartRef1, widgetChartRef2])

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const data = await getItems()
        if (!isMounted) return
        const items = Array.isArray(data?.items) ? data.items : []
        setTotalItems(items.length)
        const uniqueCategoryIds = new Set(items.map((i) => i.categoryId).filter(Boolean))
        setTotalCategories(uniqueCategoryIds.size)
      } catch (e) {
        if (isMounted) {
          setTotalItems(0)
          setTotalCategories(0)
        }
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <CRow className={props.className} xs={{ gutter: 4 }}>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="primary"
          value={
            <>
              {totalItems}             
            </>
          }
          title="Total Items"               
        />
      </CCol>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="info"
          value={
            <>
              {totalCategories}             
            </>
          }
          title="Total Category"                 
        />
      </CCol>
      
    </CRow>
  )
}

WidgetsDropdown.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

export default WidgetsDropdown
