"""
Device management for AudioSync server
"""

import time
from typing import Dict, List, Optional

class DeviceManager:
    def __init__(self):
        self.devices: Dict[str, dict] = {}
        self.device_latencies: Dict[str, List[float]] = {}
        self.max_latency_samples = 10
    
    def update_device(self, device_id: str, device_info: dict):
        """Update device information"""
        device_info['last_seen'] = time.time()
        self.devices[device_id] = device_info
        
        if device_id not in self.device_latencies:
            self.device_latencies[device_id] = []
    
    def remove_device(self, device_id: str):
        """Remove device from management"""
        if device_id in self.devices:
            del self.devices[device_id]
        if device_id in self.device_latencies:
            del self.device_latencies[device_id]
    
    def get_device_list(self) -> List[dict]:
        """Get list of all managed devices"""
        current_time = time.time()
        active_devices = []
        
        for device_id, device_info in self.devices.items():
            # Check if device is still active (seen within last 30 seconds)
            if current_time - device_info.get('last_seen', 0) < 30:
                device_copy = device_info.copy()
                device_copy['average_latency'] = self.get_average_latency(device_id)
                active_devices.append(device_copy)
        
        return active_devices
    
    def get_device(self, device_id: str) -> Optional[dict]:
        """Get specific device information"""
        return self.devices.get(device_id)
    
    def update_device_latency(self, device_id: str, latency: float):
        """Update device latency measurement"""
        if device_id not in self.device_latencies:
            self.device_latencies[device_id] = []
        
        latencies = self.device_latencies[device_id]
        latencies.append(latency)
        
        # Keep only recent latency measurements
        if len(latencies) > self.max_latency_samples:
            latencies.pop(0)
    
    def get_average_latency(self, device_id: str) -> float:
        """Get average latency for a device"""
        latencies = self.device_latencies.get(device_id, [])
        
        if not latencies:
            return 0.0
        
        return sum(latencies) / len(latencies)
    
    def get_max_latency(self) -> float:
        """Get maximum latency across all devices"""
        max_latency = 0.0
        
        for device_id in self.devices.keys():
            device_latency = self.get_average_latency(device_id)
            max_latency = max(max_latency, device_latency)
        
        return max_latency
    
    def cleanup_inactive_devices(self, timeout: float = 60.0):
        """Remove devices that haven't been seen recently"""
        current_time = time.time()
        inactive_devices = []
        
        for device_id, device_info in self.devices.items():
            if current_time - device_info.get('last_seen', 0) > timeout:
                inactive_devices.append(device_id)
        
        for device_id in inactive_devices:
            self.remove_device(device_id)
        
        return len(inactive_devices)
    
    def get_device_count(self) -> int:
        """Get total number of active devices"""
        return len(self.get_device_list())
    
    def get_device_by_name(self, device_name: str) -> Optional[dict]:
        """Find device by name"""
        for device_info in self.devices.values():
            if device_info.get('name') == device_name:
                return device_info
        return None
    
    def set_device_volume(self, device_id: str, volume: float):
        """Set volume for a specific device"""
        if device_id in self.devices:
            self.devices[device_id]['volume'] = max(0.0, min(1.0, volume))
    
    def get_device_volume(self, device_id: str) -> float:
        """Get volume for a specific device"""
        device = self.devices.get(device_id)
        return device.get('volume', 1.0) if device else 1.0
    
    def set_device_enabled(self, device_id: str, enabled: bool):
        """Enable or disable a device"""
        if device_id in self.devices:
            self.devices[device_id]['enabled'] = enabled
    
    def is_device_enabled(self, device_id: str) -> bool:
        """Check if device is enabled"""
        device = self.devices.get(device_id)
        return device.get('enabled', True) if device else False
    
    def get_synchronization_delay(self) -> float:
        """Calculate synchronization delay based on device latencies"""
        max_latency = self.get_max_latency()
        # Add buffer for network variations
        return max_latency + 0.1  # 100ms buffer
