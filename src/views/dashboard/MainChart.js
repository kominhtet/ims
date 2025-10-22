import React, { useEffect, useRef, useState } from 'react'

import { CChartBar, CChartPie } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import { getItems, getCategories } from 'src/api'
import { CRow, CCol } from '@coreui/react'

const MainChart = () => {
  const chartRef = useRef(null)
  const [labels, setLabels] = useState([])
  const [values, setValues] = useState([])
  const [originalValues, setOriginalValues] = useState([])
  const [categoryLabels, setCategoryLabels] = useState([])
  const [categoryCounts, setCategoryCounts] = useState([])

  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (chartRef.current) {
        setTimeout(() => {
          chartRef.current.options.scales.x.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          )
          chartRef.current.options.scales.x.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.x.ticks.color = getStyle('--cui-body-color')
          chartRef.current.options.scales.y.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          )
          chartRef.current.options.scales.y.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.y.ticks.color = getStyle('--cui-body-color')
          chartRef.current.update()
        })
      }
    })
  }, [chartRef])

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        // Fetch both items and categories
        const [itemsData, categoriesData] = await Promise.all([
          getItems(),
          getCategories()
        ])
        
        if (!isMounted) return
        
        const items = Array.isArray(itemsData?.items) ? itemsData.items : []
        const categories = Array.isArray(categoriesData?.items) ? categoriesData.items : []
        
        // Set bar chart data (items)
        setLabels(items.map((i) => i.itemName))
        setValues(items.map((i) => i.quantity))
        setOriginalValues(items.map((i) => i.originalQuantity))

        // Set pie chart data (categories with item counts)
        setCategoryLabels(categories.map((cat) => cat.categoryName))
        setCategoryCounts(categories.map((cat) => cat.itemCount))
      } catch (error) {
        console.error('Failed to load chart data:', error)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <CRow>
        <CCol md={7}>
          <CChartBar
            ref={chartRef}
            style={{ height: '300px', marginTop: '40px' }}
            data={{
              labels,
              datasets: [
                {
                  label: 'Quantity',
                  backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .6)`,
                  borderColor: getStyle('--cui-info'),
                  borderWidth: 1,
                  data: values,
                },
                {
                  label: 'Original Quantity',
                  backgroundColor: `rgba(${getStyle('--cui-primary-rgb')}, .4)`,
                  borderColor: getStyle('--cui-primary'),
                  borderWidth: 1,
                  data: originalValues,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    color: getStyle('--cui-body-color'),
                  },
                },
              },
              scales: {
                x: {
                  grid: {
                    color: getStyle('--cui-border-color-translucent'),
                    drawOnChartArea: false,
                  },
                  ticks: {
                    color: getStyle('--cui-body-color'),
                  },
                },
                y: {
                  beginAtZero: true,
                  border: {
                    color: getStyle('--cui-border-color-translucent'),
                  },
                  grid: {
                    color: getStyle('--cui-border-color-translucent'),
                  },
                  ticks: {
                    color: getStyle('--cui-body-color'),
                  },
                },
              },
            }}
          />
        </CCol>
        <CCol md={5}>
          <CChartPie
            style={{ height: '300px', marginTop: '40px' }}
            data={{
              labels: categoryLabels,
              datasets: [
                {
                  data: categoryCounts,
                  backgroundColor: [
                    `rgba(${getStyle('--cui-primary-rgb')}, .8)`,
                    `rgba(${getStyle('--cui-success-rgb')}, .8)`,
                    `rgba(${getStyle('--cui-info-rgb')}, .8)`,
                    `rgba(${getStyle('--cui-warning-rgb')}, .8)`,
                    `rgba(${getStyle('--cui-danger-rgb')}, .8)`,
                  ],
                  borderColor: [
                    getStyle('--cui-primary'),
                    getStyle('--cui-success'),
                    getStyle('--cui-info'),
                    getStyle('--cui-warning'),
                    getStyle('--cui-danger'),
                  ],
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom',
                  labels: {
                    color: getStyle('--cui-body-color'),
                  },
                },
              },
            }}
          />
        </CCol>
      </CRow>
    </>
  )
}

export default MainChart
