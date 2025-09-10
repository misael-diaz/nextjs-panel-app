'use client'
import { serverLog } from "@/lib/server-logger";
console.log("🎯 EXECUTIVE CALENDAR - LATEST VERSION LOADED - Calendar overlap fix applied! 🚀");
serverLog("🎯 EXECUTIVE CALENDAR - LATEST VERSION LOADED - Calendar overlap fix applied! 🚀");
console.log("🔍 DEBUG: Layout classes:", "flex flex-col lg:flex-row gap-6 max-w-full - FINAL LAYOUT");
console.log("🔍 DEBUG: ExecutiveCalendar component rendered at:", new Date().toISOString());
serverLog("🔍 DEBUG: ExecutiveCalendar component rendered at: " + new Date().toISOString());

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
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
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  
  // Load meetings from localStorage on component mount
  useEffect(() => {
    const savedMeetings = localStorage.getItem('executive-meetings')
    if (savedMeetings) {
      try {
        const parsedMeetings = JSON.parse(savedMeetings).map((meeting: any) => ({
          ...meeting,
          date: new Date(meeting.date)
        }))
        setMeetings(parsedMeetings)
        console.log("📅 Loaded meetings from localStorage:", parsedMeetings.length)
        console.log("📅 Meeting details:", parsedMeetings.map(m => ({
          title: m.title,
          date: m.date.toDateString(),
          time: m.time,
          duration: m.duration
        })))
        serverLog("📅 Loaded meetings from localStorage: " + parsedMeetings.length)
        serverLog("📅 Meeting details: " + JSON.stringify(parsedMeetings.map(m => ({
          title: m.title,
          date: m.date.toDateString(),
          time: m.time,
          duration: m.duration
        }))))
      } catch (error) {
        console.error("Error loading meetings from localStorage:", error)
        serverLog("Error loading meetings from localStorage: " + error)
      }
    } else {
      console.log("📅 No meetings found in localStorage")
      serverLog("📅 No meetings found in localStorage")
    }
  }, [])
  
  // Save meetings to localStorage whenever meetings change
  useEffect(() => {
    if (meetings.length > 0) {
      localStorage.setItem('executive-meetings', JSON.stringify(meetings))
      console.log("💾 Saved meetings to localStorage:", meetings.length)
      serverLog("💾 Saved meetings to localStorage: " + meetings.length)
    }
  }, [meetings])
  
  // Debug logging inside component where variables are available
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

  
  // Debug logging inside component where variables are available
  useEffect(() => {
    console.log("🔍 DEBUG: Current week:", currentWeek);
    console.log("🔍 DEBUG: Meetings count:", meetings.length);
    serverLog("🔍 DEBUG: Current week: " + currentWeek.toDateString());
    serverLog("🔍 DEBUG: Meetings count: " + meetings.length);
    
    // Layout debugging
    console.log("🔍 DEBUG: Layout structure analysis:");
    console.log("  - Main container: flex flex-col lg:flex-row gap-6 max-w-full");
    console.log("  - Main calendar: flex-1 lg:w-3/4 bg-white rounded-lg shadow");
    console.log("  - Small calendar: w-full lg:w-1/4");
    serverLog("🔍 DEBUG: Layout classes - Main: flex-1 lg:w-3/4, Small: w-full lg:w-1/4 - FINAL LAYOUT");
    
    // Check if elements exist in DOM
    setTimeout(() => {
      const mainContainer = document.querySelector('.flex.flex-col.lg\\:flex-row');
      const mainCalendar = document.querySelector('.flex-1.lg\\:w-3\\/4');
      const smallCalendar = document.querySelector('.w-full.lg\\:w-1\\/4');
      
      console.log("🔍 DEBUG: DOM elements found:");
      console.log("  - Main container:", mainContainer ? "✅ Found" : "❌ Not found");
      console.log("  - Main calendar:", mainCalendar ? "✅ Found" : "❌ Not found");
      console.log("  - Small calendar:", smallCalendar ? "✅ Found" : "❌ Not found");
      
      if (mainContainer) {
        const computedStyle = window.getComputedStyle(mainContainer);
        console.log("🔍 DEBUG: Main container computed styles:");
        console.log("  - display:", computedStyle.display);
        console.log("  - flex-direction:", computedStyle.flexDirection);
        console.log("  - width:", computedStyle.width);
        console.log("  - max-width:", computedStyle.maxWidth);
        serverLog("🔍 DEBUG: Container styles - display: " + computedStyle.display + ", flex-direction: " + computedStyle.flexDirection);
      }
      
      if (mainCalendar && smallCalendar) {
        const mainRect = mainCalendar.getBoundingClientRect();
        const smallRect = smallCalendar.getBoundingClientRect();
        const mainStyle = window.getComputedStyle(mainCalendar);
        const smallStyle = window.getComputedStyle(smallCalendar);
        
        console.log("🔍 DEBUG: Element positions:");
        console.log("  - Main calendar:", mainRect);
        console.log("  - Small calendar:", smallRect);
        console.log("  - Overlap check:", mainRect.right > smallRect.left ? "⚠️ OVERLAPPING" : "✅ No overlap");
        
        console.log("🔍 DEBUG: Element styles:");
        console.log("  - Main z-index:", mainStyle.zIndex, "position:", mainStyle.position);
        console.log("  - Small z-index:", smallStyle.zIndex, "position:", smallStyle.position);
        console.log("  - Main width:", mainStyle.width, "Small width:", smallStyle.width);
        
        serverLog("🔍 DEBUG: Overlap check - Main right: " + mainRect.right + ", Small left: " + smallRect.left);
        serverLog("🔍 DEBUG: Z-index - Main: " + mainStyle.zIndex + ", Small: " + smallStyle.zIndex);
        serverLog("🔍 DEBUG: Position - Main: " + mainStyle.position + ", Small: " + smallStyle.position);
      }
      
      serverLog("🔍 DEBUG: DOM elements check completed");
    }, 100);
    
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
      const durationHours = getDurationInHours(meeting.duration)
      
      // Check if this time slot falls within the meeting's duration
      return meetingDay === dayName && 
             meetingHour <= hour && 
             hour < meetingHour + durationHours
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
    console.log("🖱️ DEBUG: Time slot clicked")
    serverLog("🖱️ DEBUG: Time slot clicked")
    
    const weekDates = getWeekDates(currentWeek)
    const clickedDate = weekDates[dayIndex]
    clickedDate.setHours(hour, 0, 0, 0)
    
    const dateString = clickedDate.toISOString().split('T')[0]
    const timeString = `${String(hour).padStart(2, '0')}:00` // Always start at exact hour
    
    console.log("🔍 DEBUG: Time slot click details:")
    console.log("  - Day index:", dayIndex)
    console.log("  - Hour:", hour)
    console.log("  - Clicked date:", clickedDate.toISOString())
    console.log("  - Date string:", dateString)
    console.log("  - Time string:", timeString)
    
    serverLog("🔍 DEBUG: Time slot click - Day: " + dayIndex + ", Hour: " + hour)
    serverLog("🔍 DEBUG: Pre-filling form with date: " + dateString + ", time: " + timeString)
    
    setSelectedTimeSlot({ day: dayIndex, hour })
    setNewMeeting(prev => ({
      ...prev,
      date: dateString,
      time: timeString
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
    console.log("🚀 DEBUG: Starting handleCreateMeeting")
    serverLog("🚀 DEBUG: Starting handleCreateMeeting")
    
    // Enhanced validation
    if (!newMeeting.title.trim()) {
      console.log("❌ Validation failed: No title")
      serverLog("❌ Validation failed: No title")
      alert('Please enter a meeting title')
      return
    }
    if (!newMeeting.date) {
      console.log("❌ Validation failed: No date")
      serverLog("❌ Validation failed: No date")
      alert('Please select a date')
      return
    }
    if (!newMeeting.time) {
      console.log("❌ Validation failed: No time")
      serverLog("❌ Validation failed: No time")
      alert('Please select a time')
      return
    }

    // Create date in local timezone to avoid UTC conversion issues
    const [year, month, day] = newMeeting.date.split('-').map(Number)
    const [hours, minutes] = newMeeting.time.split(':').map(Number)
    const meetingDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
    
    const now = new Date()
    
    // Debug logging for date/time validation
    console.log("🔍 DEBUG: Meeting scheduling validation:")
    console.log("  - Input date:", newMeeting.date)
    console.log("  - Input time:", newMeeting.time)
    console.log("  - Parsed year:", year, "month:", month, "day:", day)
    console.log("  - Parsed hours:", hours, "minutes:", minutes)
    console.log("  - Meeting date object:", meetingDate.toISOString())
    console.log("  - Current date object:", now.toISOString())
    console.log("  - Meeting date timestamp:", meetingDate.getTime())
    console.log("  - Current date timestamp:", now.getTime())
    console.log("  - Is meeting in past?", meetingDate < now)
    
    serverLog("🔍 DEBUG: Meeting scheduling validation - Input: " + newMeeting.date + " " + newMeeting.time)
    serverLog("🔍 DEBUG: Meeting date: " + meetingDate.toISOString() + " vs Current: " + now.toISOString())
    serverLog("🔍 DEBUG: Is meeting in past? " + (meetingDate < now))
    
    // Check if meeting is in the past (considering both date and time)
    if (meetingDate < now) {
      console.log("❌ Meeting rejected: scheduled in the past")
      serverLog("❌ Meeting rejected: scheduled in the past")
      alert('Cannot schedule meetings in the past')
      return
    }
    
    console.log("✅ Meeting validation passed: scheduled in the future")
    serverLog("✅ Meeting validation passed: scheduled in the future")

    // Check for overlapping meetings (demo limitation: max 2 per time slot)
    const [meetingYear, meetingMonth, meetingDay] = newMeeting.date.split('-').map(Number)
    const [meetingHours, meetingMinutes] = newMeeting.time.split(':').map(Number)
    const meetingStartTime = new Date(meetingYear, meetingMonth - 1, meetingDay, meetingHours, meetingMinutes, 0, 0)
    const meetingEndTime = new Date(meetingStartTime.getTime() + (getDurationInHours(newMeeting.duration) * 60 * 60 * 1000))
    
    const overlappingCount = meetings.filter(existingMeeting => {
      const existingStart = new Date(existingMeeting.date)
      const existingEnd = new Date(existingStart.getTime() + (getDurationInHours(existingMeeting.duration) * 60 * 60 * 1000))
      
      // Check if meetings overlap
      return meetingStartTime < existingEnd && meetingEndTime > existingStart
    }).length
    
    if (overlappingCount >= 2) {
      console.log("❌ Meeting rejected: too many overlapping meetings (demo limitation: max 2)")
      serverLog("❌ Meeting rejected: too many overlapping meetings (demo limitation: max 2)")
      alert('Demo Limitation: Maximum 2 overlapping meetings per time slot. Please choose a different time or edit existing meetings.')
      return
    }

    const meeting: Meeting = {
      id: Date.now().toString(),
      title: newMeeting.title.trim(),
      date: meetingDate,
      time: newMeeting.time,
      duration: newMeeting.duration,
      attendees: newMeeting.attendees.split(',').map(a => a.trim()).filter(a => a),
      location: newMeeting.location.trim(),
      type: newMeeting.type,
      priority: newMeeting.priority,
      description: newMeeting.description.trim()
    }

    setMeetings(prev => [...prev, meeting])
    
    // Reset form
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
    
    // Success notification
    console.log("✅ Meeting scheduled successfully:", meeting.title)
    serverLog("✅ Meeting scheduled successfully: " + meeting.title)
    alert(`Meeting "${meeting.title}" scheduled successfully!`)
  }

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setNewMeeting({
      title: meeting.title,
      date: meeting.date.toISOString().split('T')[0],
      time: meeting.time,
      duration: meeting.duration,
      attendees: meeting.attendees.join(', '),
      location: meeting.location,
      type: meeting.type,
      priority: meeting.priority,
      description: meeting.description
    })
    setIsDialogOpen(true)
  }

  const handleUpdateMeeting = () => {
    console.log("🚀 DEBUG: Starting handleUpdateMeeting")
    serverLog("🚀 DEBUG: Starting handleUpdateMeeting")
    
    if (!editingMeeting) {
      console.log("❌ No editing meeting found")
      serverLog("❌ No editing meeting found")
      return
    }

    // Enhanced validation
    if (!newMeeting.title.trim()) {
      console.log("❌ Validation failed: No title")
      serverLog("❌ Validation failed: No title")
      alert('Please enter a meeting title')
      return
    }
    if (!newMeeting.date) {
      console.log("❌ Validation failed: No date")
      serverLog("❌ Validation failed: No date")
      alert('Please select a date')
      return
    }
    if (!newMeeting.time) {
      console.log("❌ Validation failed: No time")
      serverLog("❌ Validation failed: No time")
      alert('Please select a time')
      return
    }

    // Create date in local timezone to avoid UTC conversion issues
    const [year, month, day] = newMeeting.date.split('-').map(Number)
    const [hours, minutes] = newMeeting.time.split(':').map(Number)
    const meetingDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
    
    const now = new Date()
    
    // Debug logging for date/time validation
    console.log("🔍 DEBUG: Meeting update validation:")
    console.log("  - Input date:", newMeeting.date)
    console.log("  - Input time:", newMeeting.time)
    console.log("  - Parsed year:", year, "month:", month, "day:", day)
    console.log("  - Parsed hours:", hours, "minutes:", minutes)
    console.log("  - Meeting date object:", meetingDate.toISOString())
    console.log("  - Current date object:", now.toISOString())
    console.log("  - Meeting date timestamp:", meetingDate.getTime())
    console.log("  - Current date timestamp:", now.getTime())
    console.log("  - Is meeting in past?", meetingDate < now)
    
    serverLog("🔍 DEBUG: Meeting update validation - Input: " + newMeeting.date + " " + newMeeting.time)
    serverLog("🔍 DEBUG: Meeting date: " + meetingDate.toISOString() + " vs Current: " + now.toISOString())
    serverLog("🔍 DEBUG: Is meeting in past? " + (meetingDate < now))
    
    // Check if meeting is in the past (considering both date and time)
    if (meetingDate < now) {
      console.log("❌ Meeting update rejected: scheduled in the past")
      serverLog("❌ Meeting update rejected: scheduled in the past")
      alert('Cannot schedule meetings in the past')
      return
    }
    
    console.log("✅ Meeting update validation passed: scheduled in the future")
    serverLog("✅ Meeting update validation passed: scheduled in the future")

    const updatedMeeting: Meeting = {
      ...editingMeeting,
      title: newMeeting.title.trim(),
      date: meetingDate,
      time: newMeeting.time,
      duration: newMeeting.duration,
      attendees: newMeeting.attendees.split(',').map(a => a.trim()).filter(a => a),
      location: newMeeting.location.trim(),
      type: newMeeting.type,
      priority: newMeeting.priority,
      description: newMeeting.description.trim()
    }

    setMeetings(prev => prev.map(m => m.id === editingMeeting.id ? updatedMeeting : m))
    
    // Reset form and close dialog
    setEditingMeeting(null)
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
    
    console.log("✅ Meeting updated successfully:", updatedMeeting.title)
    serverLog("✅ Meeting updated successfully: " + updatedMeeting.title)
    alert(`Meeting "${updatedMeeting.title}" updated successfully!`)
  }

  const handleDeleteMeeting = (meetingId: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      setMeetings(prev => prev.filter(m => m.id !== meetingId))
      console.log("🗑️ Meeting deleted:", meetingId)
      serverLog("🗑️ Meeting deleted: " + meetingId)
      alert('Meeting deleted successfully!')
    }
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
              <DialogTitle>{editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}</DialogTitle>
              <DialogDescription>
                {editingMeeting ? 'Update the meeting details.' : 'Add a new meeting to the executive calendar.'}
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
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false)
                setEditingMeeting(null)
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
              }}>
                Cancel
              </Button>
              <Button onClick={editingMeeting ? handleUpdateMeeting : handleCreateMeeting}>
                {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* La Jaula Style Calendar */}
      <div className="flex flex-col lg:flex-row gap-8 max-w-full">
        {/* Main Google-like Calendar */}
        <div className="flex-1 lg:w-3/4 bg-white rounded-lg shadow overflow-hidden max-w-none">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Executive Calendar</h2>
                <p className="text-sm text-gray-600">Centralized view of meetings, events and appointments</p>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
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
                  Today
                </button>
                <button 
                  onClick={() => handleNavigation('prev')}
                  className="px-3 py-1 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button 
                  onClick={() => handleNavigation('next')}
                  className="px-3 py-1 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50"
                >
                  Next
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
                  Day
                </button>
                <button 
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 text-xs font-medium rounded border ${
                    viewMode === 'week' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 text-xs font-medium rounded border ${
                    viewMode === 'month' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Month
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
              <div className="p-3 text-xs font-medium text-gray-600 border-r text-center">Time</div>
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
                  // Get all meetings for this day and hour, including those that might overlap
                  const dayMeetings = getFilteredMeetings().filter(meeting => {
                    const meetingDate = new Date(meeting.date)
                    const meetingHour = parseInt(meeting.time.split(':')[0])
                    const meetingMinutes = parseInt(meeting.time.split(':')[1])
                    const durationHours = getDurationInHours(meeting.duration)
                    
                    // Check if this meeting overlaps with the current time slot
                    const meetingStart = meetingHour * 60 + meetingMinutes
                    const meetingEnd = meetingStart + (durationHours * 60)
                    const slotStart = hour * 60
                    const slotEnd = (hour + 1) * 60
                    
                    // Meeting overlaps if it starts before slot ends and ends after slot starts
                    const overlaps = meetingStart < slotEnd && meetingEnd > slotStart
                    
                    return meetingDate.toDateString() === date.toDateString() && overlaps
                  })
                  
                  // Check for overlapping meetings and limit to 2
                  const overlappingMeetings = dayMeetings.length > 2 ? dayMeetings.slice(0, 2) : dayMeetings
                  
                  console.log(`🔍 DEBUG: Time slot ${hour}:00 - Found ${dayMeetings.length} meetings, showing ${overlappingMeetings.length}`)
                  console.log(`🔍 DEBUG: Current date being checked: ${date.toDateString()}`)
                  serverLog(`🔍 DEBUG: Time slot ${hour}:00 - Found ${dayMeetings.length} meetings, showing ${overlappingMeetings.length}`)
                  serverLog(`🔍 DEBUG: Current date being checked: ${date.toDateString()}`)
                  
                  return (
                    <div 
                      key={dayIndex}
                      className={`p-1 border-r min-h-[60px] hover:bg-gray-50 cursor-pointer relative ${
                        date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleTimeSlotClick(dayIndex, hour)}
                    >
                      {overlappingMeetings.map((meeting, idx) => {
                        const durationHours = getDurationInHours(meeting.duration)
                        const height = Math.max(60 * durationHours, 60)
                        
                        // Calculate offset based on minutes (only 0 or 30 minutes now)
                        const [meetingHours, meetingMinutes] = meeting.time.split(':').map(Number)
                        const topOffset = meetingMinutes === 30 ? 30 : 0 // 30px for 30-minute offset, 0px for exact hour
                        
                        // Only show meeting in its starting time slot
                        const isStartingSlot = meetingHours === hour
                        if (!isStartingSlot) return null
                        
                        // Google Calendar style: side-by-side layout for overlapping meetings
                        const isOverlapping = overlappingMeetings.length > 1
                        const meetingWidth = isOverlapping ? 'calc(50% - 2px)' : 'calc(100% - 8px)'
                        const meetingLeft = isOverlapping ? (idx === 0 ? '4px' : 'calc(50% + 2px)') : '4px'
                        
                        console.log(`🔍 DEBUG: Meeting "${meeting.title}" - Time: ${meeting.time}, Overlapping: ${isOverlapping}, Width: ${meetingWidth}, Left: ${meetingLeft}`)
                        serverLog(`🔍 DEBUG: Meeting "${meeting.title}" - Time: ${meeting.time}, Overlapping: ${isOverlapping}, Width: ${meetingWidth}, Left: ${meetingLeft}`)
                        
                        return (
                          <div 
                            key={idx} 
                            className={`absolute rounded text-xs p-2 border-l-4 ${getMeetingColor(meeting.type)} group hover:shadow-md transition-shadow z-10 ${isOverlapping ? 'border-r border-gray-300' : ''}`}
                            style={{ 
                              height: `${height - 8}px`,
                              top: `${topOffset + 4}px`,
                              width: meetingWidth,
                              left: meetingLeft
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0" onClick={(e) => {
                                e.stopPropagation()
                                handleEditMeeting(meeting)
                              }}>
                                <div className="font-medium truncate cursor-pointer hover:text-blue-600">{meeting.title}</div>
                                <div className="text-xs opacity-75">{meeting.time} - {meeting.location}</div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditMeeting(meeting)
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs px-1"
                                  title="Edit meeting"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteMeeting(meeting.id)
                                  }}
                                  className="text-red-600 hover:text-red-800 text-xs px-1"
                                  title="Delete meeting"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
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

        {/* Small Calendar Widget on the Right */}
        <div className="w-full lg:w-1/4 flex-shrink-0 min-w-0">
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <div className="text-center mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {format(currentWeek, 'MMMM yyyy')}
              </h3>
            </div>
            
            {/* Simple Calendar Grid */}
            <div className="mb-4">
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-xs font-medium text-gray-500 p-1">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    className={`text-xs p-1 rounded hover:bg-gray-100 ${
                      day === 10 ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
                    }`}
                    onClick={() => setSelectedDate(new Date(2025, 8, day))}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <button 
                onClick={() => setViewMode('day')}
                className={`w-full px-3 py-1 text-xs font-medium rounded border ${
                  viewMode === 'day' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'border-gray-300'
                }`}
              >
                Day
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`w-full px-3 py-1 text-xs font-medium rounded border ${
                  viewMode === 'week' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'border-gray-300'
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`w-full px-3 py-1 text-xs font-medium rounded border ${
                  viewMode === 'month' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'border-gray-300'
                }`}
              >
                Month
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
