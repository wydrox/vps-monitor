package stats

import (
	"sync"
	"time"

	"github.com/hhftechnology/vps-monitor/internal/models"
)

type DataPoint struct {
	CPUPercent    float64
	MemoryPercent float64
	Timestamp     time.Time
}

type ContainerHistory struct {
	mu         sync.RWMutex
	dataPoints []DataPoint
	maxSize    int
}

type HistoryManager struct {
	mu         sync.RWMutex
	containers map[string]*ContainerHistory
	maxSize    int
}

func NewHistoryManager() *HistoryManager {
	return &HistoryManager{
		containers: make(map[string]*ContainerHistory),
		maxSize:    720,
	}
}

func (hm *HistoryManager) RecordStats(containerID string, stats models.ContainerStats) {
	hm.mu.Lock()
	defer hm.mu.Unlock()

	if _, exists := hm.containers[containerID]; !exists {
		hm.containers[containerID] = &ContainerHistory{
			dataPoints: make([]DataPoint, 0, hm.maxSize),
			maxSize:    hm.maxSize,
		}
	}

	history := hm.containers[containerID]
	history.mu.Lock()
	defer history.mu.Unlock()

	dataPoint := DataPoint{
		CPUPercent:    stats.CPUPercent,
		MemoryPercent: stats.MemoryPercent,
		Timestamp:     time.Unix(stats.Timestamp, 0),
	}

	history.dataPoints = append(history.dataPoints, dataPoint)

	if len(history.dataPoints) > history.maxSize {
		history.dataPoints = history.dataPoints[1:]
	}
}

func (hm *HistoryManager) GetAverages(containerID string, duration time.Duration) (cpuAvg, memAvg float64, hasData bool) {
	hm.mu.RLock()
	defer hm.mu.RUnlock()

	history, exists := hm.containers[containerID]
	if !exists {
		return 0, 0, false
	}

	history.mu.RLock()
	defer history.mu.RUnlock()

	if len(history.dataPoints) == 0 {
		return 0, 0, false
	}

	now := time.Now()
	cutoff := now.Add(-duration)

	var cpuSum, memSum float64
	var count int

	for i := len(history.dataPoints) - 1; i >= 0; i-- {
		dp := history.dataPoints[i]
		if dp.Timestamp.Before(cutoff) {
			break
		}
		cpuSum += dp.CPUPercent
		memSum += dp.MemoryPercent
		count++
	}

	if count == 0 {
		return 0, 0, false
	}

	return cpuSum / float64(count), memSum / float64(count), true
}

func (hm *HistoryManager) Get1hAverages(containerID string) (cpuAvg, memAvg float64, hasData bool) {
	return hm.GetAverages(containerID, time.Hour)
}

func (hm *HistoryManager) Get12hAverages(containerID string) (cpuAvg, memAvg float64, hasData bool) {
	return hm.GetAverages(containerID, 12*time.Hour)
}

func (hm *HistoryManager) CleanupContainer(containerID string) {
	hm.mu.Lock()
	defer hm.mu.Unlock()
	delete(hm.containers, containerID)
}
