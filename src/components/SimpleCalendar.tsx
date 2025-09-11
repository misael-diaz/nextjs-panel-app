'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameWeek } from 'date-fns'
import { serverLog } from '@/lib/server-logger'

interface Event {
  id: string
  title: string
  date: Date
  time: string
  description?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'teal' | 'pink'
  duration?: number // in minutes
}

// Google Calendar color palette
const eventColors = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' }
}

export default function SimpleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [view, setView] = useState<'month' | 'week'>('week')
  const [showOverlapWarning, setShowOverlapWarning] = useState(false)
  const [pendingEventData, setPendingEventData] = useState<Omit<Event, 'id'> | null>(null)
  const [editingEventInDialog, setEditingEventInDialog] = useState<Event | null>(null)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [dropIndicator, setDropIndicator] = useState<{ day: Date; time: string } | null>(null)
  // Resize functionality for duration modification only
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartY, setResizeStartY] = useState(0)
  const [resizeStartDuration, setResizeStartDuration] = useState(0)
  const [resizingEvent, setResizingEvent] = useState<Event | null>(null)

  // localStorage functions
  const saveEventsToStorage = (eventsToSave: Event[]) => {
    try {
      const eventsWithSerializedDates = eventsToSave.map(event => ({
        ...event,
        date: event.date.toISOString()
      }))
      localStorage.setItem('calendar-events', JSON.stringify(eventsWithSerializedDates))
      serverLog(`Calendar: Saved ${eventsToSave.length} events to localStorage`, 'info')
    } catch (error) {
      serverLog(`Calendar: Error saving events to localStorage: ${error}`, 'error')
    }
  }

  const loadEventsFromStorage = (): Event[] => {
    try {
      const stored = localStorage.getItem('calendar-events')
      if (stored) {
        const parsedEvents = JSON.parse(stored).map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }))
        serverLog(`Calendar: Loaded ${parsedEvents.length} events from localStorage`, 'info')
        return parsedEvents
      }
    } catch (error) {
      serverLog(`Calendar: Error loading events from localStorage: ${error}`, 'error')
    }
    return []
  }

  // Load events from localStorage on component mount
  useEffect(() => {
    const loadedEvents = loadEventsFromStorage()
    if (loadedEvents.length === 0) {
      // Add sample events if no events exist
      const sampleEvents: Event[] = [
        {
          id: '1',
          title: 'Team Meeting',
          date: new Date(),
          time: '09:00',
          duration: 60,
          color: 'blue'
        },
        {
          id: '2',
          title: 'Client Call',
          date: new Date(),
          time: '09:30',
          duration: 30,
          color: 'green'
        },
        {
          id: '3',
          title: 'Lunch',
          date: new Date(),
          time: '12:00',
          duration: 60,
          color: 'orange'
        },
        {
          id: '4',
          title: 'Project Review',
          date: new Date(),
          time: '14:00',
          duration: 90,
          color: 'purple'
        },
        {
          id: '5',
          title: 'Quick Sync',
          date: new Date(),
          time: '14:30',
          duration: 30,
          color: 'red'
        }
      ]
      setEvents(sampleEvents)
      saveEventsToStorage(sampleEvents)
    } else {
      setEvents(loadedEvents)
    }
  }, [])

  // Save events to localStorage whenever events change
  useEffect(() => {
    if (events.length > 0) {
      saveEventsToStorage(events)
    }
  }, [events])

  // Month view calculations
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get days to fill the calendar grid (including days from previous/next month)
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay())
  
  const calendarEnd = new Date(monthEnd)
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()))
  
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Week view calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }) // Sunday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Generate time slots for week view (6 AM to 10 PM)
  const timeSlots = []
  for (let hour = 6; hour <= 22; hour++) {
    timeSlots.push({
      hour,
      time: `${hour.toString().padStart(2, '0')}:00`,
      label: hour < 12 ? `${hour === 0 ? 12 : hour} AM` : `${hour === 12 ? 12 : hour - 12} PM`
    })
  }

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      if (direction === 'prev') {
        setCurrentDate(subMonths(currentDate, 1))
        serverLog(`Calendar: Navigated to previous month (${format(subMonths(currentDate, 1), 'MMMM yyyy')})`, 'info')
      } else {
        setCurrentDate(addMonths(currentDate, 1))
        serverLog(`Calendar: Navigated to next month (${format(addMonths(currentDate, 1), 'MMMM yyyy')})`, 'info')
      }
    } else {
      if (direction === 'prev') {
        setCurrentDate(subWeeks(currentDate, 1))
        serverLog(`Calendar: Navigated to previous week (${format(subWeeks(currentDate, 1), 'MMM d, yyyy')})`, 'info')
      } else {
        setCurrentDate(addWeeks(currentDate, 1))
        serverLog(`Calendar: Navigated to next week (${format(addWeeks(currentDate, 1), 'MMM d, yyyy')})`, 'info')
      }
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date))
  }

  // Calculate event position and height based on time and duration
  const getEventStyle = (event: Event, dayEvents: Event[]) => {
    const [hours, minutes] = event.time.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const duration = event.duration || 60
    
    // Each hour slot is 60px, so each minute is 1px
    const topOffset = startMinutes - (6 * 60) // Subtract 6 AM offset
    const height = duration
    
    // Find overlapping events with improved logic
    const overlappingEvents = dayEvents.filter(otherEvent => {
      if (otherEvent.id === event.id) return false
      
      const [otherHours, otherMinutes] = otherEvent.time.split(':').map(Number)
      const otherStartMinutes = otherHours * 60 + otherMinutes
      const otherDuration = otherEvent.duration || 60
      const otherEndMinutes = otherStartMinutes + otherDuration
      const eventEndMinutes = startMinutes + duration
      
      // Check if events overlap (improved overlap detection)
      return startMinutes < otherEndMinutes && eventEndMinutes > otherStartMinutes
    })
    
    // Sort overlapping events by start time for consistent positioning
    const sortedOverlappingEvents = overlappingEvents.sort((a, b) => {
      const [aHours, aMinutes] = a.time.split(':').map(Number)
      const [bHours, bMinutes] = b.time.split(':').map(Number)
      const aStartMinutes = aHours * 60 + aMinutes
      const bStartMinutes = bHours * 60 + bMinutes
      
      // If start times are the same, use event ID as tie-breaker for consistent positioning
      if (aStartMinutes === bStartMinutes) {
        return a.id.localeCompare(b.id)
      }
      
      return aStartMinutes - bStartMinutes
    })
    
    // Only handle up to 2 overlapping events
    if (overlappingEvents.length > 1) {
      // Show warning for more than 2 overlapping events
      return {
        top: `${Math.max(0, topOffset)}px`,
        height: `${height}px`,
        minHeight: '20px',
        width: '100%',
        left: '0%',
        zIndex: 10,
        backgroundColor: '#fee2e2', // Light red background
        borderLeft: '4px solid #dc2626' // Red border
      }
    }
    
    // Handle 2 overlapping events side by side
    if (overlappingEvents.length === 1) {
      // Find this event's position in the sorted list
      const allEventsInTimeRange = [event, ...overlappingEvents].sort((a, b) => {
        const [aHours, aMinutes] = a.time.split(':').map(Number)
        const [bHours, bMinutes] = b.time.split(':').map(Number)
        const aStartMinutes = aHours * 60 + aMinutes
        const bStartMinutes = bHours * 60 + bMinutes
        
        // If start times are the same, use event ID as tie-breaker for consistent positioning
        if (aStartMinutes === bStartMinutes) {
          return a.id.localeCompare(b.id)
        }
        
        return aStartMinutes - bStartMinutes
      })
      
      const eventIndex = allEventsInTimeRange.findIndex(e => e.id === event.id)
      const isFirst = eventIndex === 0
      
      return {
        top: `${Math.max(0, topOffset)}px`,
        height: `${height}px`,
        minHeight: '20px',
        width: 'calc(50% - 1px)', // Slightly less than 50% to prevent gaps
        left: isFirst ? '0%' : 'calc(50% + 1px)', // Add 1px gap between events
        zIndex: 10 + (isFirst ? 1 : 0) // Slight z-index difference for visual layering
      }
    }
    
    // Single event - full width
    return {
      top: `${Math.max(0, topOffset)}px`,
      height: `${height}px`,
      minHeight: '20px',
      width: '100%',
      left: '0%',
      zIndex: 10
    }
  }

  // Get events that should be displayed in a specific time slot
  const getEventsForTimeSlot = (date: Date, timeSlot: { hour: number; time: string }) => {
    return getEventsForDate(date).filter(event => {
      const [eventHours, eventMinutes] = event.time.split(':').map(Number)
      const eventStartMinutes = eventHours * 60 + eventMinutes
      const eventEndMinutes = eventStartMinutes + (event.duration || 60)
      const slotStartMinutes = timeSlot.hour * 60
      const slotEndMinutes = slotStartMinutes + 60
      
      // Event overlaps with this time slot
      return eventStartMinutes < slotEndMinutes && eventEndMinutes > slotStartMinutes
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowEventForm(true)
    serverLog(`Calendar: User clicked on date ${format(date, 'MMMM d, yyyy')} to create event`, 'info')
  }

  const handleTimeSlotClick = (date: Date, time: string) => {
    // Create a new date with the selected time
    const dateWithTime = new Date(date)
    const [hours, minutes] = time.split(':').map(Number)
    dateWithTime.setHours(hours, minutes, 0, 0)
    
    setSelectedDate(dateWithTime)
    setShowEventForm(true)
    serverLog(`Calendar: User clicked on time slot ${time} on ${format(date, 'MMMM d, yyyy')} to create event`, 'info')
  }

  const handleCreateEvent = (eventData: Omit<Event, 'id'>) => {
    // Check for overlapping events before creating
    const dayEvents = getEventsForDate(eventData.date)
    const [eventHours, eventMinutes] = eventData.time.split(':').map(Number)
    const eventStartMinutes = eventHours * 60 + eventMinutes
    const eventDuration = eventData.duration || 60
    const eventEndMinutes = eventStartMinutes + eventDuration
    
    // Find overlapping events
    const overlappingEvents = dayEvents.filter(existingEvent => {
      const [existingHours, existingMinutes] = existingEvent.time.split(':').map(Number)
      const existingStartMinutes = existingHours * 60 + existingMinutes
      const existingDuration = existingEvent.duration || 60
      const existingEndMinutes = existingStartMinutes + existingDuration
      
      // Check if events overlap
      return eventStartMinutes < existingEndMinutes && eventEndMinutes > existingStartMinutes
    })
    
    // If there are already 2 overlapping events, prevent creation and show warning
    if (overlappingEvents.length >= 2) {
      setPendingEventData(eventData)
      setShowOverlapWarning(true)
      serverLog(`Calendar: Prevented creation of third overlapping event "${eventData.title}" - demo limitation`, 'warn')
      return
    }
    
    const colors = Object.keys(eventColors) as Array<keyof typeof eventColors>
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(),
      color: randomColor,
      duration: eventData.duration || 60 // Default 1 hour
    }
    setEvents([...events, newEvent])
    setShowEventForm(false)
    setSelectedDate(null)
    setEditingEvent(null)
    serverLog(`Calendar: Created new event "${eventData.title}" on ${format(eventData.date, 'MMMM d, yyyy')} at ${eventData.time}`, 'info')
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setSelectedDate(event.date)
    setShowEventForm(true)
    serverLog(`Calendar: Started editing event "${event.title}"`, 'info')
  }

  const handleUpdateEvent = (eventData: Omit<Event, 'id'>) => {
    if (editingEvent) {
      // Check for overlapping events before updating (excluding the current event being edited)
      const dayEvents = getEventsForDate(eventData.date).filter(e => e.id !== editingEvent.id)
      const [eventHours, eventMinutes] = eventData.time.split(':').map(Number)
      const eventStartMinutes = eventHours * 60 + eventMinutes
      const eventDuration = eventData.duration || 60
      const eventEndMinutes = eventStartMinutes + eventDuration
      
      // Find overlapping events (excluding the one being edited)
      const overlappingEvents = dayEvents.filter(existingEvent => {
        const [existingHours, existingMinutes] = existingEvent.time.split(':').map(Number)
        const existingStartMinutes = existingHours * 60 + existingMinutes
        const existingDuration = existingEvent.duration || 60
        const existingEndMinutes = existingStartMinutes + existingDuration
        
        // Check if events overlap
        return eventStartMinutes < existingEndMinutes && eventEndMinutes > existingStartMinutes
      })
      
      // If there are already 2 overlapping events, prevent update and show warning
      if (overlappingEvents.length >= 2) {
        setPendingEventData(eventData)
        setEditingEventInDialog(editingEvent)
        setShowOverlapWarning(true)
        serverLog(`Calendar: Prevented update of event "${eventData.title}" - would create third overlap`, 'warn')
        return
      }
      
      const updatedEvent: Event = {
        ...eventData,
        id: editingEvent.id,
        color: eventData.color || editingEvent.color,
        duration: eventData.duration || 60
      }
      setEvents(events.map(e => e.id === editingEvent.id ? updatedEvent : e))
      setShowEventForm(false)
      setSelectedDate(null)
      setEditingEvent(null)
      serverLog(`Calendar: Updated event "${eventData.title}" on ${format(eventData.date, 'MMMM d, yyyy')} at ${eventData.time}`, 'info')
    }
  }

  const handleDeleteEvent = (eventId: string) => {
    const eventToDelete = events.find(e => e.id === eventId)
    if (eventToDelete) {
      setEvents(events.filter(e => e.id !== eventId))
      serverLog(`Calendar: Deleted event "${eventToDelete.title}"`, 'info')
    }
  }

  const handleCreateEventWithNewDate = (updatedEventData: Omit<Event, 'id'>) => {
    if (!pendingEventData) return

    const colors = Object.keys(eventColors) as Array<keyof typeof eventColors>
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    const newEvent: Event = {
      ...updatedEventData,
      id: Date.now().toString(),
      color: updatedEventData.color || randomColor
    }
    
    setEvents([...events, newEvent])
    setShowOverlapWarning(false)
    setPendingEventData(null)
    setEditingEventInDialog(null)
    setShowEventForm(false)
    setSelectedDate(null)
    setEditingEvent(null)
    serverLog(`Calendar: Created event "${updatedEventData.title}" on ${format(updatedEventData.date, 'MMMM d, yyyy')} at ${updatedEventData.time} to avoid overlap`, 'info')
  }

  const handleUpdateEventWithNewDate = (updatedEventData: Omit<Event, 'id'>) => {
    if (!editingEventInDialog) return

    const updatedEvent: Event = {
      ...updatedEventData,
      id: editingEventInDialog.id,
      color: updatedEventData.color || editingEventInDialog.color
    }
    
    setEvents(events.map(e => e.id === editingEventInDialog.id ? updatedEvent : e))
    setShowOverlapWarning(false)
    setPendingEventData(null)
    setEditingEventInDialog(null)
    setShowEventForm(false)
    setSelectedDate(null)
    setEditingEvent(null)
    serverLog(`Calendar: Updated event "${updatedEventData.title}" on ${format(updatedEventData.date, 'MMMM d, yyyy')} at ${updatedEventData.time} to avoid overlap`, 'info')
  }

  // Drag and drop handlers
  const handleDragStart = (event: React.MouseEvent, eventData: Event) => {
    if (isResizing) return // Don't start dragging if we're resizing
    
    event.preventDefault()
    setDraggedEvent(eventData)
    setIsDragging(true)
    
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    })
    
    serverLog(`Calendar: Started dragging event "${eventData.title}"`, 'info')
  }

  const handleDragEnd = () => {
    if (draggedEvent) {
      setDraggedEvent(null)
      setIsDragging(false)
      setDragOffset({ x: 0, y: 0 })
      setDropIndicator(null)
      serverLog(`Calendar: Finished dragging event "${draggedEvent.title}"`, 'info')
    }
  }

  // Resize handlers for duration modification only (no position shifting)
  const handleResizeStart = (event: React.MouseEvent, eventData: Event) => {
    event.preventDefault()
    event.stopPropagation()
    
    setResizingEvent(eventData)
    setIsResizing(true)
    setResizeStartY(event.clientY)
    setResizeStartDuration(eventData.duration || 60)
    
    serverLog(`Calendar: Started resizing event "${eventData.title}" - Duration: ${eventData.duration || 60}`, 'info')
  }

  const handleResizeEnd = () => {
    if (isResizing && resizingEvent) {
      setIsResizing(false)
      setResizingEvent(null)
      setResizeStartY(0)
      setResizeStartDuration(0)
      serverLog(`Calendar: Finished resizing event "${resizingEvent.title}"`, 'info')
    }
  }

  const handleResize = (event: React.MouseEvent) => {
    if (!isResizing || !resizingEvent) return

    const deltaY = event.clientY - resizeStartY
    const deltaMinutes = Math.round(deltaY) // 1 pixel = 1 minute
    
    // Only change duration, keep start time fixed
    const newDuration = Math.max(15, resizeStartDuration + deltaMinutes)
    
    setEvents(events.map(e => 
      e.id === resizingEvent.id 
        ? { ...e, duration: newDuration }
        : e
    ))
  }

  const calculateDropTime = (relativeY: number) => {
    const timeSlotHeight = 60 // pixels per hour
    const startHour = 6 // 6 AM start time
    
    const timeSlotIndex = Math.floor(relativeY / timeSlotHeight)
    const newHour = startHour + timeSlotIndex
    
    const minutesInSlot = ((relativeY % timeSlotHeight) / timeSlotHeight) * 60
    const newMinute = Math.floor(minutesInSlot / 15) * 15 // Round to 15-minute intervals
    
    const clampedHour = Math.max(6, Math.min(22, newHour))
    const clampedMinute = newMinute >= 60 ? 0 : newMinute
    
    const finalHour = clampedMinute === 0 && newMinute >= 60 ? clampedHour + 1 : clampedHour
    const finalMinute = newMinute >= 60 ? 0 : clampedMinute
    
    return `${finalHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`
  }

  const handleDrop = (event: React.MouseEvent, targetDate: Date) => {
    if (!draggedEvent) return

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const relativeY = event.clientY - rect.top
    
    const newTime = calculateDropTime(relativeY)
    
    // Check for overlapping events before dropping (excluding the current dragged event)
    const dayEvents = getEventsForDate(targetDate).filter(e => e.id !== draggedEvent.id)
    const [eventHours, eventMinutes] = newTime.split(':').map(Number)
    const eventStartMinutes = eventHours * 60 + eventMinutes
    const eventDuration = draggedEvent.duration || 60
    const eventEndMinutes = eventStartMinutes + eventDuration
    
    // Find overlapping events
    const overlappingEvents = dayEvents.filter(existingEvent => {
      const [existingHours, existingMinutes] = existingEvent.time.split(':').map(Number)
      const existingStartMinutes = existingHours * 60 + existingMinutes
      const existingDuration = existingEvent.duration || 60
      const existingEndMinutes = existingStartMinutes + existingDuration
      
      // Check if events overlap
      return eventStartMinutes < existingEndMinutes && eventEndMinutes > existingStartMinutes
    })
    
    // If there are already 2 overlapping events, prevent drop and show warning
    if (overlappingEvents.length >= 2) {
      setShowOverlapWarning(true)
      serverLog(`Calendar: Prevented drag-and-drop of event "${draggedEvent.title}" - would create third overlap`, 'warn')
      handleDragEnd()
      return
    }
    
    // Update the event
    const updatedEvent = {
      ...draggedEvent,
      date: targetDate,
      time: newTime
    }
    
    setEvents(events.map(e => e.id === draggedEvent.id ? updatedEvent : e))
    
    serverLog(`Calendar: Moved event "${draggedEvent.title}" to ${format(targetDate, 'MMMM d, yyyy')} at ${newTime}`, 'info')
    
    handleDragEnd()
  }

  return (
    <div 
      className="w-full max-w-7xl mx-auto bg-white h-[calc(100vh-200px)] flex flex-col"
      onMouseUp={(e) => {
        handleDragEnd()
        handleResizeEnd()
      }}
      onMouseLeave={(e) => {
        handleDragEnd()
        handleResizeEnd()
      }}
      onMouseMove={(e) => {
        setMousePosition({ x: e.clientX, y: e.clientY })
        if (isResizing) {
          handleResize(e)
        }
      }}
    >
      {/* Google Calendar-style Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Title and Navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-normal text-gray-900">
                {view === 'month' 
                  ? format(currentDate, 'MMMM yyyy')
                  : `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
                }
              </h1>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePeriod('prev')}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePeriod('next')}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Today Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentDate(new Date())
                serverLog(`Calendar: User clicked "Today" button - navigated to current ${view}`, 'info')
              }}
              className="h-8 px-3 text-sm font-medium border-gray-300 hover:bg-gray-50"
            >
              Today
            </Button>
          </div>

          {/* Right side - View Toggle and Create Event */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setView('week')
                  serverLog('Calendar: Switched to week view', 'info')
                }}
                className="h-8 px-3 text-sm font-medium rounded-none border-0"
              >
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setView('month')
                  serverLog('Calendar: Switched to month view', 'info')
                }}
                className="h-8 px-3 text-sm font-medium rounded-none border-0"
              >
                Month
              </Button>
            </div>
            
            {/* Create Event Button */}
            <Button
              size="sm"
              onClick={() => {
                setSelectedDate(new Date())
                setShowEventForm(true)
                serverLog('Calendar: User clicked "Create" button', 'info')
              }}
              className="h-8 px-4 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>
        </div>
      </div>
      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'month' ? (
          /* Month View */
          <div className="h-full">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center font-medium text-gray-600 text-sm border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 h-full">
              {allDays.map((day, index) => {
                const dayEvents = getEventsForDate(day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isToday = isSameDay(day, new Date())
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50
                      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                      ${isToday ? 'bg-blue-50' : ''}
                      last:border-r-0
                    `}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600 font-semibold' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Events for this day */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 4).map(event => {
                        const colorClass = event.color ? eventColors[event.color] : eventColors.blue
                        return (
                          <div
                            key={event.id}
                            className={`text-xs ${colorClass.bg} ${colorClass.text} px-2 py-1 rounded-sm truncate border-l-2 ${colorClass.border}`}
                          >
                            {event.time} - {event.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 4 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{dayEvents.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Week View - Google Calendar Style with Event Positioning */
          <div className="h-full flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
              <div className="p-3 text-center font-medium text-gray-600 text-sm border-r border-gray-200">
                Time
              </div>
              {weekDays.map(day => {
                const isToday = isSameDay(day, new Date())
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                      isToday ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-600">{format(day, 'EEE')}</div>
                    <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Calendar Grid with Events */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-8 relative">
                {/* Time labels column */}
                <div className="border-r border-gray-200 bg-gray-50">
                  {timeSlots.map(timeSlot => (
                    <div
                      key={timeSlot.hour}
                      className="h-[60px] p-2 text-right text-xs text-gray-500 border-b border-gray-200 flex items-start justify-end"
                    >
                      {timeSlot.label}
                    </div>
                  ))}
                </div>
                
                {/* Day columns with events */}
                {weekDays.map(day => {
                  const isToday = isSameDay(day, new Date())
                  const dayEvents = getEventsForDate(day)
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`relative border-r border-gray-200 last:border-r-0 ${
                        isToday ? 'bg-blue-25' : 'bg-white'
                      } ${isDragging ? 'hover:bg-blue-50' : ''}`}
                      onMouseUp={(e) => handleDrop(e, day)}
                      onMouseMove={(e) => {
                        if (isDragging && draggedEvent) {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const relativeY = e.clientY - rect.top
                          const newTime = calculateDropTime(relativeY)
                          setDropIndicator({ day, time: newTime })
                        }
                      }}
                    >
                      {/* Time slot grid lines */}
                      {timeSlots.map(timeSlot => (
                        <div
                          key={timeSlot.hour}
                          className="h-[60px] border-b border-gray-200 cursor-pointer hover:bg-blue-50"
                          onClick={() => handleTimeSlotClick(day, timeSlot.time)}
                        />
                      ))}
                      
                      {/* Drop indicator */}
                      {isDragging && dropIndicator && isSameDay(day, dropIndicator.day) && (
                        <div
                          className="absolute left-0 right-0 bg-blue-500 opacity-50 border-t-2 border-blue-600 z-20"
                          style={{
                            top: `${((parseInt(dropIndicator.time.split(':')[0]) - 6) * 60) + (parseInt(dropIndicator.time.split(':')[1]) / 60 * 60)}px`,
                            height: `${draggedEvent?.duration || 60}px`
                          }}
                        >
                          <div className="text-xs text-white font-medium p-1">
                            {dropIndicator.time} - {draggedEvent?.title}
                          </div>
                        </div>
                      )}

                      {/* Events positioned absolutely */}
                      {dayEvents.map(event => {
                        const colorClass = event.color ? eventColors[event.color] : eventColors.blue
                        const eventStyle = getEventStyle(event, dayEvents)
                        const isBeingDragged = draggedEvent?.id === event.id
                        
                        // Check if this event has more than 2 overlapping events
                        const overlappingEvents = dayEvents.filter(otherEvent => {
                          if (otherEvent.id === event.id) return false
                          
                          const [eventHours, eventMinutes] = event.time.split(':').map(Number)
                          const [otherHours, otherMinutes] = otherEvent.time.split(':').map(Number)
                          const eventStartMinutes = eventHours * 60 + eventMinutes
                          const otherStartMinutes = otherHours * 60 + otherMinutes
                          const eventDuration = event.duration || 60
                          const otherDuration = otherEvent.duration || 60
                          const eventEndMinutes = eventStartMinutes + eventDuration
                          const otherEndMinutes = otherStartMinutes + otherDuration
                          
                          return eventStartMinutes < otherEndMinutes && eventEndMinutes > otherStartMinutes
                        })
                        
                        const hasTooManyOverlaps = overlappingEvents.length > 1
                        
                        return (
                          <div
                            key={event.id}
                            className={`absolute rounded-sm border-l-2 cursor-move hover:opacity-80 transition-all group ${
                              hasTooManyOverlaps 
                                ? 'bg-red-100 text-red-800 border-red-200' 
                                : `${colorClass.bg} ${colorClass.text} ${colorClass.border}`
                            } ${isBeingDragged ? 'opacity-50 scale-105 shadow-lg' : ''} ${isResizing && resizingEvent?.id === event.id ? 'pointer-events-none' : ''}`}
                            style={eventStyle}
                            onMouseDown={(e) => handleDragStart(e, event)}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (hasTooManyOverlaps) {
                                setShowOverlapWarning(true)
                                serverLog('Calendar: User clicked on event with too many overlaps - showing warning', 'warn')
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              handleEditEvent(event)
                            }}
                          >
                            {/* Event content */}
                            <div className="p-1 text-xs font-medium truncate select-none flex items-center justify-between">
                              <span>
                                {event.time} - {event.title}
                                {hasTooManyOverlaps && ' ⚠️'}
                              </span>
                              <div className="flex gap-1 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditEvent(event)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 hover:bg-blue-200 rounded px-1 text-xs transition-opacity"
                                  title="Edit event"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm(`Delete "${event.title}"?`)) {
                                      handleDeleteEvent(event.id)
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 hover:bg-red-200 rounded px-1 text-xs transition-opacity"
                                  title="Delete event"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                            
                            {/* Bottom resize handle - only for duration modification */}
                            <div
                              className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-green-500 hover:bg-opacity-30 transition-colors border-b-2 border-transparent hover:border-green-400"
                              onMouseDown={(e) => handleResizeStart(e, event)}
                              title="Resize duration (drag down to extend)"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Creation/Edit Form */}
      {showEventForm && selectedDate && (
        <EventForm
          selectedDate={selectedDate}
          selectedTime={format(selectedDate, 'HH:mm')}
          editingEvent={editingEvent}
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          onClose={() => {
            setShowEventForm(false)
            setSelectedDate(null)
            setEditingEvent(null)
          }}
        />
      )}

      {/* Overlap Warning Dialog */}
      {showOverlapWarning && pendingEventData && (
        <OverlapWarningDialog
          pendingEventData={pendingEventData}
          editingEvent={editingEventInDialog}
          onClose={() => {
            setShowOverlapWarning(false)
            setPendingEventData(null)
            setEditingEventInDialog(null)
            serverLog('Calendar: User closed overlap prevention warning dialog', 'info')
          }}
          onCreateWithNewDate={handleCreateEventWithNewDate}
          onUpdateWithNewDate={handleUpdateEventWithNewDate}
        />
      )}

      {/* Dragging Ghost Event */}
      {isDragging && draggedEvent && (
        <div
          className={`fixed pointer-events-none z-50 rounded-sm border-l-2 shadow-lg p-1 text-xs font-medium truncate select-none ${
            draggedEvent.color ? eventColors[draggedEvent.color].bg + ' ' + eventColors[draggedEvent.color].text + ' ' + eventColors[draggedEvent.color].border : 'bg-blue-100 text-blue-800 border-blue-200'
          }`}
          style={{
            left: mousePosition.x - dragOffset.x,
            top: mousePosition.y - dragOffset.y,
            minWidth: '120px',
            opacity: 0.8
          }}
        >
          {draggedEvent.time} - {draggedEvent.title}
        </div>
      )}
    </div>
  )
}

// Simple Event Form Component
function EventForm({ 
  selectedDate, 
  selectedTime,
  editingEvent,
  onCreateEvent,
  onUpdateEvent,
  onClose 
}: { 
  selectedDate: Date
  selectedTime?: string
  editingEvent?: Event | null
  onCreateEvent: (event: Omit<Event, 'id'>) => void
  onUpdateEvent?: (event: Omit<Event, 'id'>) => void
  onClose: () => void 
}) {
  const [title, setTitle] = useState(editingEvent?.title || '')
  const [time, setTime] = useState(editingEvent?.time || selectedTime || format(selectedDate, 'HH:mm'))
  const [description, setDescription] = useState(editingEvent?.description || '')
  const [duration, setDuration] = useState(editingEvent?.duration || 60) // Default 1 hour
  const [color, setColor] = useState<Event['color']>(editingEvent?.color || 'blue')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      const eventData = {
        title: title.trim(),
        date: selectedDate,
        time,
        description: description.trim() || undefined,
        duration,
        color
      }
      
      if (editingEvent && onUpdateEvent) {
        onUpdateEvent(eventData)
        serverLog(`Calendar: Event form updated for "${title.trim()}" on ${format(selectedDate, 'MMMM d, yyyy')} for ${duration} minutes`, 'info')
      } else {
        onCreateEvent(eventData)
        serverLog(`Calendar: Event form submitted for "${title.trim()}" on ${format(selectedDate, 'MMMM d, yyyy')} for ${duration} minutes`, 'info')
      }
    } else {
      serverLog('Calendar: Event form submitted with empty title - validation failed', 'warn')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl">
        {/* Google Calendar-style Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {editingEvent ? 'Edit event' : 'Create event'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Date Display */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm font-medium text-gray-700">Date</div>
            <div className="text-sm text-gray-600">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add title"
              required
              autoFocus
            />
          </div>
          
          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
                <option value={480}>8 hours</option>
              </select>
            </div>
          </div>
          
          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(eventColors).map(([colorName, colorClass]) => (
                <button
                  key={colorName}
                  type="button"
                  onClick={() => setColor(colorName as Event['color'])}
                  className={`p-3 rounded-md border-2 transition-all ${
                    color === colorName 
                      ? 'border-gray-400 ring-2 ring-blue-500' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${colorClass.bg} ${colorClass.text}`}
                  title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                >
                  {colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Add description"
            />
          </div>
        </form>
        
        {/* Google Calendar-style Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => {
              onClose()
              serverLog('Calendar: Event form cancelled by user', 'info')
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
          >
            {editingEvent ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Overlap Warning Dialog Component with Date Picker and Editing
function OverlapWarningDialog({ 
  pendingEventData, 
  editingEvent,
  onClose, 
  onCreateWithNewDate,
  onUpdateWithNewDate
}: { 
  pendingEventData: Omit<Event, 'id'>
  editingEvent: Event | null
  onClose: () => void
  onCreateWithNewDate: (updatedEventData: Omit<Event, 'id'>) => void
  onUpdateWithNewDate: (updatedEventData: Omit<Event, 'id'>) => void
}) {
  const [selectedNewDate, setSelectedNewDate] = useState(pendingEventData.date)
  const [editedEventData, setEditedEventData] = useState({
    title: pendingEventData.title,
    time: pendingEventData.time,
    duration: pendingEventData.duration || 60,
    description: pendingEventData.description || '',
    color: pendingEventData.color || 'blue' as Event['color']
  })

  const handleSaveWithNewDate = () => {
    const updatedEventData = {
      ...pendingEventData,
      ...editedEventData,
      date: selectedNewDate
    }
    
    if (editingEvent) {
      onUpdateWithNewDate(updatedEventData)
    } else {
      onCreateWithNewDate(updatedEventData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
        <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-red-500 mr-3 text-2xl">🚫</span>
              Demo Limitation - Cannot {editingEvent ? 'Update' : 'Create'} Event
            </h2>
        </div>
        <div className="px-8 py-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-6">
            <p className="text-red-800 font-semibold mb-3 text-lg">
              This demo calendar only supports up to 2 overlapping events.
            </p>
            <p className="text-red-700 text-base">
              You already have 2 events overlapping at this time. {editingEvent ? 'Updating' : 'Creating'} a third overlapping event is not allowed in this demonstration.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
            <p className="text-green-800 font-semibold mb-3 text-lg">
              Quick Solution: Edit Event Details
            </p>
            <p className="text-green-700 text-base mb-4">
              Edit your event details and choose a different date to avoid the overlap:
            </p>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-green-800 font-medium mb-1">Event Title:</label>
                <input
                  type="text"
                  value={editedEventData.title}
                  onChange={(e) => setEditedEventData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Event title"
                />
              </div>
              
              {/* Time and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-800 font-medium mb-1">Time:</label>
                  <input
                    type="time"
                    value={editedEventData.time}
                    onChange={(e) => setEditedEventData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-green-800 font-medium mb-1">Duration:</label>
                  <select
                    value={editedEventData.duration}
                    onChange={(e) => setEditedEventData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                    <option value={240}>4 hours</option>
                    <option value={480}>8 hours</option>
                  </select>
                </div>
              </div>
              
              {/* Date */}
              <div>
                <label className="block text-green-800 font-medium mb-1">Date:</label>
                <input
                  type="date"
                  value={format(selectedNewDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedNewDate(new Date(e.target.value))}
                  className="px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              {/* Color */}
              <div>
                <label className="block text-green-800 font-medium mb-2">Color:</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(eventColors).map(([colorName, colorClass]) => (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => setEditedEventData(prev => ({ ...prev, color: colorName as Event['color'] }))}
                      className={`p-2 rounded-md border-2 transition-all ${
                        editedEventData.color === colorName 
                          ? 'border-gray-400 ring-2 ring-green-500' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${colorClass.bg} ${colorClass.text}`}
                      title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                    >
                      {colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSaveWithNewDate}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
              >
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4 text-lg font-semibold">
            Other options:
          </p>
          <ul className="text-base text-gray-600 space-y-3 mb-6">
            <li>• Choose a different time slot that doesn't overlap</li>
            <li>• Edit one of the existing events to change its time</li>
            <li>• Delete one of the existing overlapping events</li>
          </ul>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
            <p className="text-blue-800 text-base font-semibold mb-3">
              In a production calendar system:
            </p>
            <ul className="text-base text-blue-700 space-y-2">
              <li>• Events would stack vertically with smaller heights</li>
              <li>• Show a "+X more" indicator for additional events</li>
              <li>• Provide conflict resolution and scheduling tools</li>
              <li>• Allow expanding to see all overlapping events</li>
            </ul>
          </div>
        </div>
        <div className="px-8 py-6 border-t border-gray-200 flex justify-end">
          <Button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

