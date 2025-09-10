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
}

export default function SimpleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<'month' | 'week'>('week')

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
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString()
    }
    setEvents([...events, newEvent])
    setShowEventForm(false)
    setSelectedDate(null)
    serverLog(`Calendar: Created new event "${eventData.title}" on ${format(eventData.date, 'MMMM d, yyyy')} at ${eventData.time}`, 'info')
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {view === 'month' 
                ? format(currentDate, 'MMMM yyyy')
                : `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
              }
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={view === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setView('week')
                    serverLog('Calendar: Switched to week view', 'info')
                  }}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Week
                </Button>
                <Button
                  variant={view === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setView('month')
                    serverLog('Calendar: Switched to month view', 'info')
                  }}
                  className="rounded-l-none"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Month
                </Button>
              </div>
              
              {/* Navigation */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigatePeriod('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date())
                  serverLog(`Calendar: User clicked "Today" button - navigated to current ${view}`, 'info')
                }}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigatePeriod('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'month' ? (
            /* Month View */
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600 text-sm">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {allDays.map((day, index) => {
                const dayEvents = getEventsForDate(day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isToday = isSameDay(day, new Date())
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50
                      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                      ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                    `}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Events for this day */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate"
                        >
                          {event.time} - {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Week View */
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Day headers */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="p-2 text-center font-semibold text-gray-600 text-sm">
                    Time
                  </div>
                  {weekDays.map(day => {
                    const isToday = isSameDay(day, new Date())
                    return (
                      <div
                        key={day.toISOString()}
                        className={`p-2 text-center font-semibold text-sm ${
                          isToday ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                        }`}
                      >
                        <div className="text-xs">{format(day, 'EEE')}</div>
                        <div className="text-lg font-bold">{format(day, 'd')}</div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Time slots */}
                <div className="grid grid-cols-8 gap-1">
                  {timeSlots.map(timeSlot => (
                    <React.Fragment key={timeSlot.hour}>
                      {/* Time label */}
                      <div className="p-2 text-right text-xs text-gray-500 border-r border-gray-200">
                        {timeSlot.label}
                      </div>
                      
                      {/* Day columns */}
                      {weekDays.map(day => {
                        const dayEvents = getEventsForDate(day).filter(event => 
                          event.time.startsWith(timeSlot.time.substring(0, 2))
                        )
                        const isToday = isSameDay(day, new Date())
                        
                        return (
                          <div
                            key={`${day.toISOString()}-${timeSlot.hour}`}
                            className={`
                              min-h-[60px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
                              ${isToday ? 'bg-blue-25' : 'bg-white'}
                            `}
                            onClick={() => handleTimeSlotClick(day, timeSlot.time)}
                          >
                            {/* Events for this time slot */}
                            {dayEvents.map(event => (
                              <div
                                key={event.id}
                                className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded mb-1 truncate"
                              >
                                {event.title}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onCreateEvent({
        title: title.trim(),
        date: selectedDate,
        time,
        description: description.trim() || undefined
      })
      serverLog(`Calendar: Event form submitted for "${title.trim()}" on ${format(selectedDate, 'MMMM d, yyyy')}`, 'info')
    } else {
      serverLog('Calendar: Event form submitted with empty title - validation failed', 'warn')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <div className="text-sm text-gray-600">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Event title"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Event description (optional)"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Event
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                onClose()
                serverLog('Calendar: Event form cancelled by user', 'info')
              }}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

