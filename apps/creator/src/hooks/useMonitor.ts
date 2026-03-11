import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useAppStore } from '../store/appStore'

export interface StudentMonitorData {
    id: string
    name: string
    className: string
    ip: string
    progress: number
    score: number | null
    status: 'working' | 'tabout' | 'submitted' | 'disconnected'
    lastHeartbeat: number
}

export function useMonitor() {
    const { isMonitorActive, setMonitorActive } = useAppStore()
    const [students, setStudents] = useState<Record<string, StudentMonitorData>>({})
    const [serverInfo, setServerInfo] = useState({ ip: '0.0.0.0', port: 41235 })

    // Start/Stop monitoring
    const toggleMonitor = async () => {
        try {
            if (isMonitorActive) {
                await invoke('stop_receive_mode')
                setMonitorActive(false)
            } else {
                await invoke('start_receive_mode', { port: 41235 })
                setMonitorActive(true)
            }
        } catch (error) {
            console.error('Failed to toggle monitor:', error)
        }
    }

    // Load initial status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const status = await invoke<{ isRunning: boolean; ip: string; port: number }>('get_lan_server_status')
                setMonitorActive(status.isRunning)
                setServerInfo({ ip: status.ip, port: status.port })
            } catch (error) {
                console.error('Failed to fetch monitor status:', error)
            }
        }
        fetchStatus()
    }, [])

    // Listen for events
    useEffect(() => {
        const unlistenHeartbeat = listen<{ studentId: string; studentName: string; class: string; completionPercent: number; windowFocused: boolean; ip?: string }>('heartbeat-received', (event) => {
            const data = event.payload
            setStudents(prev => ({
                ...prev,
                [data.studentId]: {
                    ...prev[data.studentId],
                    id: data.studentId,
                    name: data.studentName,
                    className: data.class,
                    progress: data.completionPercent,
                    status: data.windowFocused ? 'working' : 'tabout',
                    lastHeartbeat: Date.now(),
                    ip: data.ip || prev[data.studentId]?.ip || 'Unknown'
                }
            }))
        })

        const unlistenResult = listen<{ studentId: string; studentName: string; class: string; earnedPoints: number; ip?: string }>('result-received', (event) => {
            const data = event.payload
            setStudents(prev => ({
                ...prev,
                [data.studentId]: {
                    ...prev[data.studentId],
                    id: data.studentId,
                    name: data.studentName,
                    className: data.class,
                    progress: 100,
                    score: data.earnedPoints,
                    status: 'submitted',
                    lastHeartbeat: Date.now(),
                    ip: data.ip || prev[data.studentId]?.ip || 'Unknown'
                }
            }))
        })

        // Check for disconnections
        const interval = setInterval(() => {
            const now = Date.now()
            setStudents(prev => {
                let changed = false
                const next = { ...prev }
                for (const id in next) {
                    if (next[id].status !== 'submitted' && now - next[id].lastHeartbeat > 30000) {
                        if (next[id].status !== 'disconnected') {
                            next[id] = { ...next[id], status: 'disconnected' }
                            changed = true
                        }
                    }
                }
                return changed ? next : prev
            })
        }, 5000)

        return () => {
            unlistenHeartbeat.then(fn => fn())
            unlistenResult.then(fn => fn())
            clearInterval(interval)
        }
    }, [])

    const studentsList = Object.values(students)
    const stats = {
        total: studentsList.length,
        submitted: studentsList.filter(s => s.status === 'submitted').length,
        working: studentsList.filter(s => s.status === 'working').length,
        tabout: studentsList.filter(s => s.status === 'tabout').length,
    }

    return {
        isMonitorActive,
        toggleMonitor,
        students: studentsList,
        stats,
        serverInfo
    }
}
