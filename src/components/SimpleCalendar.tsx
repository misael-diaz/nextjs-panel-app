'use client'

import React, { useState } from 'react'
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
  const [events, setEvents] = useState<Event[]>([
    // Sample overlapping events for demonstration
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
  ])
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<'month' | 'week'>('week')
  const [showOverlapWarning, setShowOverlapWarning] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [dropIndicator, setDropIndicator] = useState<{ day: Date; time: string } | null>(null)
  // Resize functionality completely removed

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
    
    // Find overlapping events
    const overlappingEvents = dayEvents.filter(otherEvent => {
      if (otherEvent.id === event.id) return false
      
      const [otherHours, otherMinutes] = otherEvent.time.split(':').map(Number)
      const otherStartMinutes = otherHours * 60 + otherMinutes
      const otherDuration = otherEvent.duration || 60
      const otherEndMinutes = otherStartMinutes + otherDuration
      const eventEndMinutes = startMinutes + duration
      
      // Check if events overlap
      return startMinutes < otherEndMinutes && eventEndMinutes > otherStartMinutes
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
      const otherEvent = overlappingEvents[0]
      const isFirst = event.time <= otherEvent.time
      
      return {
        top: `${Math.max(0, topOffset)}px`,
        height: `${height}px`,
        minHeight: '20px',
        width: '50%',
        left: isFirst ? '0%' : '50%',
        zIndex: 10
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
    serverLog(`Calendar: Created new event "${eventData.title}" on ${format(eventData.date, 'MMMM d, yyyy')} at ${eventData.time}`, 'info')
  }

  // Drag and drop handlers
  const handleDragStart = (event: React.MouseEvent, eventData: Event) => {
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

  // Resize handlers completely removed

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
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
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
                            className={`absolute rounded-sm border-l-2 cursor-move hover:opacity-80 transition-all ${
                              hasTooManyOverlaps 
                                ? 'bg-red-100 text-red-800 border-red-200' 
                                : `${colorClass.bg} ${colorClass.text} ${colorClass.border}`
                            } ${isBeingDragged ? 'opacity-50 scale-105 shadow-lg' : ''}`}
                            style={eventStyle}
                            onMouseDown={(e) => handleDragStart(e, event)}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (hasTooManyOverlaps) {
                                setShowOverlapWarning(true)
                                serverLog('Calendar: User clicked on event with too many overlaps - showing warning', 'warn')
                              }
                              // Could add event editing here
                            }}
                          >
                            {/* Event content */}
                            <div className="p-1 text-xs font-medium truncate select-none">
                              {event.time} - {event.title}
                              {hasTooManyOverlaps && ' ⚠️'}
                            </div>
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

      {/* Event Creation Form */}
      {showEventForm && selectedDate && (
        <EventForm
          selectedDate={selectedDate}
          selectedTime={format(selectedDate, 'HH:mm')}
          onCreateEvent={handleCreateEvent}
          onClose={() => {
            setShowEventForm(false)
            setSelectedDate(null)
          }}
        />
      )}

      {/* Overlap Warning Dialog */}
      {showOverlapWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="text-yellow-500 mr-2">⚠️</span>
                Demo Limitation
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">
                This demo calendar supports up to 2 overlapping events displayed side by side. 
                For more than 2 overlapping events, a production calendar would typically:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 mb-4">
                <li>• Stack events vertically with smaller heights</li>
                <li>• Show a "+X more" indicator</li>
                <li>• Allow expanding to see all events</li>
                <li>• Provide conflict resolution tools</li>
              </ul>
              <p className="text-sm text-gray-500">
                This is a demonstration of the side-by-side overlapping feature for 2 events.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <Button 
                onClick={() => {
                  setShowOverlapWarning(false)
                  serverLog('Calendar: User closed overlap warning dialog', 'info')
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4"
              >
                Got it!
              </Button>
            </div>
          </div>
        </div>
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
  onCreateEvent, 
  onClose 
}: { 
  selectedDate: Date
  selectedTime?: string
  onCreateEvent: (event: Omit<Event, 'id'>) => void
  onClose: () => void 
}) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState(selectedTime || format(selectedDate, 'HH:mm'))
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60) // Default 1 hour

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onCreateEvent({
        title: title.trim(),
        date: selectedDate,
        time,
        description: description.trim() || undefined,
        duration
      })
      serverLog(`Calendar: Event form submitted for "${title.trim()}" on ${format(selectedDate, 'MMMM d, yyyy')} for ${duration} minutes`, 'info')
    } else {
      serverLog('Calendar: Event form submitted with empty title - validation failed', 'warn')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl">
        {/* Google Calendar-style Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Create event</h2>
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
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

