'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
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

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get days to fill the calendar grid (including days from previous/next month)
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay())
  
  const calendarEnd = new Date(monthEnd)
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()))
  
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1))
      serverLog(`Calendar: Navigated to previous month (${format(subMonths(currentDate, 1), 'MMMM yyyy')})`, 'info')
    } else {
      setCurrentDate(addMonths(currentDate, 1))
      serverLog(`Calendar: Navigated to next month (${format(addMonths(currentDate, 1), 'MMMM yyyy')})`, 'info')
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
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date())
                  serverLog(`Calendar: User clicked "Today" button - navigated to current month (${format(new Date(), 'MMMM yyyy')})`, 'info')
                }}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
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
        </CardContent>
      </Card>

      {/* Event Creation Form */}
      {showEventForm && selectedDate && (
        <EventForm
          selectedDate={selectedDate}
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
  onCreateEvent, 
  onClose 
}: { 
  selectedDate: Date
  onCreateEvent: (event: Omit<Event, 'id'>) => void
  onClose: () => void 
}) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
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

