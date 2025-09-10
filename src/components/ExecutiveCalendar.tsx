'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Clock, Users, MapPin, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Meeting {
  id: string
  title: string
  date: Date
  time: string
  duration: string
  attendees: string[]
  location: string
  type: 'board' | 'executive' | 'client' | 'internal'
  priority: 'high' | 'medium' | 'low'
  description: string
}

const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Board of Directors Meeting',
    date: new Date(2024, 8, 15), // September 15, 2024
    time: '10:00 AM',
    duration: '2 hours',
    attendees: ['CEO', 'CFO', 'CTO', 'Board Members'],
    location: 'Conference Room A',
    type: 'board',
    priority: 'high',
    description: 'Quarterly board meeting to review company performance and strategic initiatives.'
  },
  {
    id: '2',
    title: 'Client Presentation - Nike Partnership',
    date: new Date(2024, 8, 18), // September 18, 2024
    time: '2:00 PM',
    duration: '1.5 hours',
    attendees: ['CEO', 'Sales Director', 'Nike Representatives'],
    location: 'Executive Conference Room',
    type: 'client',
    priority: 'high',
    description: 'Present new product line proposal to Nike for potential partnership agreement.'
  },
  {
    id: '3',
    title: 'Executive Team Weekly Sync',
    date: new Date(2024, 8, 20), // September 20, 2024
    time: '9:00 AM',
    duration: '1 hour',
    attendees: ['CEO', 'CFO', 'CTO', 'COO'],
    location: 'CEO Office',
    type: 'executive',
    priority: 'medium',
    description: 'Weekly executive team meeting to discuss operational updates and strategic priorities.'
  },
  {
    id: '4',
    title: 'Q4 Planning Session',
    date: new Date(2024, 8, 25), // September 25, 2024
    time: '1:00 PM',
    duration: '3 hours',
    attendees: ['All Department Heads'],
    location: 'Main Conference Room',
    type: 'internal',
    priority: 'high',
    description: 'Strategic planning session for Q4 objectives and budget allocation.'
  }
]

export default function ExecutiveCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'agenda'>('week')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{day: number, hour: number} | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    time: '',
    duration: '1 hour',
    attendees: '',
    location: '',
    type: 'internal' as const,
    priority: 'medium' as const,
    description: ''
  })

  // Load meetings from localStorage on component mount
  useEffect(() => {
    const savedMeetings = localStorage.getItem('executiveMeetings')
    if (savedMeetings) {
      const parsedMeetings = JSON.parse(savedMeetings).map((meeting: any) => ({
        ...meeting,
        date: new Date(meeting.date)
      }))
      setMeetings(parsedMeetings)
    } else {
      // Initialize with mock data if no saved data exists
      setMeetings(mockMeetings)
      localStorage.setItem('executiveMeetings', JSON.stringify(mockMeetings))
    }
  }, [])

  // Save meetings to localStorage whenever meetings change
  useEffect(() => {
    if (meetings.length > 0) {
      localStorage.setItem('executiveMeetings', JSON.stringify(meetings))
    }
  }, [meetings])

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => 
      meeting.date.toDateString() === date.toDateString()
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'board': return 'bg-purple-100 text-purple-800'
      case 'executive': return 'bg-blue-100 text-blue-800'
      case 'client': return 'bg-green-100 text-green-800'
      case 'internal': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <AlertCircle className="w-4 h-4 text-red-500" />
    return null
  }

  const selectedDateMeetings = selectedDate ? getMeetingsForDate(selectedDate) : []

  const getMeetingsForTimeSlot = (dayIndex: number, hour: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayName = days[dayIndex]
    
    return meetings.filter(meeting => {
      const meetingDay = meeting.date.toLocaleDateString('en-US', { weekday: 'long' })
      const meetingHour = parseInt(meeting.time.split(':')[0])
      return meetingDay === dayName && meetingHour === hour
    })
  }

  const getMeetingColor = (type: string) => {
    switch (type) {
      case 'board': return 'bg-purple-200 border-purple-300 text-purple-800'
      case 'executive': return 'bg-red-200 border-red-300 text-red-800'
      case 'client': return 'bg-green-200 border-green-300 text-green-800'
      case 'internal': return 'bg-blue-200 border-blue-300 text-blue-800'
      default: return 'bg-gray-200 border-gray-300 text-gray-800'
    }
  }

  const getWeekDates = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    start.setDate(diff)
    
    const week = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      week.push(day)
    }
    return week
  }

  const getDurationInHours = (duration: string) => {
    switch (duration) {
      case '30 minutes': return 0.5
      case '1 hour': return 1
      case '1.5 hours': return 1.5
      case '2 hours': return 2
      case '3 hours': return 3
      default: return 1
    }
  }

  const getFilteredMeetings = () => {
    if (activeFilters.length === 0) return meetings
    return meetings.filter(meeting => activeFilters.includes(meeting.type))
  }

  const handleTimeSlotClick = (dayIndex: number, hour: number) => {
    const weekDates = getWeekDates(currentWeek)
    const clickedDate = weekDates[dayIndex]
    clickedDate.setHours(hour, 0, 0, 0)
    
    setSelectedTimeSlot({ day: dayIndex, hour })
    setNewMeeting(prev => ({
      ...prev,
      date: clickedDate.toISOString().split('T')[0],
      time: `${String(hour).padStart(2, '0')}:00`
    }))
    setIsDialogOpen(true)
  }

  const handleNavigation = (direction: 'today' | 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    switch (direction) {
      case 'today':
        setCurrentWeek(new Date())
        break
      case 'prev':
        newWeek.setDate(newWeek.getDate() - 7)
        setCurrentWeek(newWeek)
        break
      case 'next':
        newWeek.setDate(newWeek.getDate() + 7)
        setCurrentWeek(newWeek)
        break
    }
  }

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const handleCreateMeeting = () => {
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time) {
      alert('Please fill in all required fields')
      return
    }

    const meeting: Meeting = {
      id: Date.now().toString(),
      title: newMeeting.title,
      date: new Date(newMeeting.date),
      time: newMeeting.time,
      duration: newMeeting.duration,
      attendees: newMeeting.attendees.split(',').map(a => a.trim()).filter(a => a),
      location: newMeeting.location,
      type: newMeeting.type,
      priority: newMeeting.priority,
      description: newMeeting.description
    }

    setMeetings(prev => [...prev, meeting])
    setNewMeeting({
      title: '',
      date: '',
      time: '',
      duration: '1 hour',
      attendees: '',
      location: '',
      type: 'internal',
      priority: 'medium',
      description: ''
    })
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Executive Calendar</h2>
          <p className="text-gray-600">Monday, September 10, 2024</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>
                Add a new meeting to the executive calendar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input 
                  id="title" 
                  className="col-span-3" 
                  placeholder="Meeting title"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input 
                  id="date" 
                  type="date" 
                  className="col-span-3"
                  value={newMeeting.date}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <Input 
                  id="time" 
                  type="time" 
                  className="col-span-3"
                  value={newMeeting.time}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration
                </Label>
                <Select value={newMeeting.duration} onValueChange={(value) => setNewMeeting(prev => ({ ...prev, duration: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30 minutes">30 minutes</SelectItem>
                    <SelectItem value="1 hour">1 hour</SelectItem>
                    <SelectItem value="1.5 hours">1.5 hours</SelectItem>
                    <SelectItem value="2 hours">2 hours</SelectItem>
                    <SelectItem value="3 hours">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select value={newMeeting.type} onValueChange={(value: any) => setNewMeeting(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="board">Board Meeting</SelectItem>
                    <SelectItem value="executive">Executive Meeting</SelectItem>
                    <SelectItem value="client">Client Meeting</SelectItem>
                    <SelectItem value="internal">Internal Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Select value={newMeeting.priority} onValueChange={(value: any) => setNewMeeting(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="attendees" className="text-right">
                  Attendees
                </Label>
                <Input 
                  id="attendees" 
                  className="col-span-3" 
                  placeholder="Comma-separated list of attendees"
                  value={newMeeting.attendees}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, attendees: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input 
                  id="location" 
                  className="col-span-3" 
                  placeholder="Meeting location"
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea 
                  id="description" 
                  className="col-span-3" 
                  placeholder="Meeting description"
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMeeting}>
                Schedule Meeting
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* La Jaula Style Calendar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Calendar */}
        <div className="flex-1 lg:w-3/4 bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Executive Calendar</h2>
                <p className="text-sm text-gray-600">Centralized view of meetings, events and appointments</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {format(currentWeek, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => toggleFilter('board')}
                className={`px-3 py-1 text-xs font-medium rounded border ${
                  activeFilters.includes('board') 
                    ? 'bg-purple-100 text-purple-800 border-purple-200' 
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                Board Meetings
              </button>
              <button 
                onClick={() => toggleFilter('executive')}
                className={`px-3 py-1 text-xs font-medium rounded border ${
                  activeFilters.includes('executive') 
                    ? 'bg-red-100 text-red-800 border-red-200' 
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                Executive Meetings
              </button>
              <button 
                onClick={() => toggleFilter('client')}
                className={`px-3 py-1 text-xs font-medium rounded border ${
                  activeFilters.includes('client') 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                Client Meetings
              </button>
              <button 
                onClick={() => toggleFilter('internal')}
                className={`px-3 py-1 text-xs font-medium rounded border ${
                  activeFilters.includes('internal') 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                Internal Meetings
              </button>
              <button className="px-3 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800 border border-gray-200">
                Status
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleNavigation('today')}
                  className="px-3 py-1 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50"
                >
                  Hoy
                </button>
                <button 
                  onClick={() => handleNavigation('prev')}
                  className="px-3 py-1 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <button 
                  onClick={() => handleNavigation('next')}
                  className="px-3 py-1 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50"
                >
                  Siguiente
                </button>
                <span className="text-sm text-gray-600 ml-4">
                  {format(getWeekDates(currentWeek)[0], 'MMMM d')} - {format(getWeekDates(currentWeek)[6], 'MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1 text-xs font-medium rounded border ${
                    viewMode === 'day' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Día
                </button>
                <button 
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 text-xs font-medium rounded border ${
                    viewMode === 'week' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Semana
                </button>
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 text-xs font-medium rounded border ${
                    viewMode === 'month' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Mes
                </button>
                <button 
                  onClick={() => setViewMode('agenda')}
                  className={`px-3 py-1 text-xs font-medium rounded border ${
                    viewMode === 'agenda' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Agenda
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-8 bg-gray-50 border-b">
              <div className="p-3 text-xs font-medium text-gray-600 border-r text-center">Hora</div>
              {getWeekDates(currentWeek).map((date, index) => (
                <div 
                  key={index} 
                  className={`p-3 text-xs font-medium text-gray-600 border-r text-center ${
                    date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                  }`}
                >
                  {format(date, 'EEE')}
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                <div className="p-2 text-xs text-gray-500 border-r bg-gray-50 text-center">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {getWeekDates(currentWeek).map((date, dayIndex) => {
                  const dayMeetings = getFilteredMeetings().filter(meeting => {
                    const meetingDate = new Date(meeting.date)
                    const meetingHour = parseInt(meeting.time.split(':')[0])
                    return meetingDate.toDateString() === date.toDateString() && meetingHour === hour
                  })
                  
                  return (
                    <div 
                      key={dayIndex}
                      className={`p-1 border-r min-h-[60px] hover:bg-gray-50 cursor-pointer relative ${
                        date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleTimeSlotClick(dayIndex, hour)}
                    >
                      {dayMeetings.map((meeting, idx) => {
                        const durationHours = getDurationInHours(meeting.duration)
                        const height = Math.max(60 * durationHours, 60)
                        
                        return (
                          <div 
                            key={idx} 
                            className={`absolute inset-1 rounded text-xs p-2 border-l-4 ${getMeetingColor(meeting.type)}`}
                            style={{ height: `${height - 8}px` }}
                            onClick={(e) => {
                              e.stopPropagation()
                              // Handle meeting click for details
                            }}
                          >
                            <div className="font-medium truncate">{meeting.title}</div>
                            <div className="text-xs opacity-75">{meeting.time} - {meeting.location}</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Small Calendar Widget */}
        <div className="w-full lg:w-1/4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {format(currentWeek, 'MMMM yyyy')}
              </h3>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full"
            />
            <div className="mt-4 space-y-2">
              <button 
                onClick={() => setViewMode('day')}
                className={`w-full px-3 py-1 text-xs font-medium rounded border ${
                  viewMode === 'day' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'border-gray-300'
                }`}
              >
                Día
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`w-full px-3 py-1 text-xs font-medium rounded border ${
                  viewMode === 'week' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'border-gray-300'
                }`}
              >
                Semana
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`w-full px-3 py-1 text-xs font-medium rounded border ${
                  viewMode === 'month' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'border-gray-300'
                }`}
              >
                Mes
              </button>
              <button 
                onClick={() => setViewMode('agenda')}
                className={`w-full px-3 py-1 text-xs font-medium rounded border ${
                  viewMode === 'agenda' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'border-gray-300'
                }`}
              >
                Agenda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
