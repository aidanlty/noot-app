<template>
  <div class="page booking">
    <h1>Book An Appointment with us!</h1>
    <form class="booking-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="license-plate">Vehicle License Plate</label>
        <input 
          id="license-plate" 
          v-model="formData.licensePlate"
          placeholder="e.g., ABC-1234" 
          required 
        />
      </div>
      
      <div class="form-group">
        <label for="make">Vehicle Make</label>
        <select id="make" v-model="makeSelection" @change="onMakeChange" required>
          <option value="" disabled>Select make</option>
          <option v-for="make in carMakes" :key="make" :value="make">{{ make }}</option>
          <option value="custom">Other</option>
        </select>
        
        <input 
          v-if="showCustomMakeInput"
          id="make-custom"
          v-model="formData.make"
          placeholder="Enter your vehicle make"
          class="custom-make-input"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="model">Vehicle Model</label>
        <select 
          id="model-select" 
          v-model="modelSelection" 
          @change="onModelSelectChange"
          :disabled="!formData.make" 
          required
        >
          <option value="" disabled>{{ formData.make ? 'Select model' : 'Select make first' }}</option>
          <option v-for="model in availableModels" :key="model" :value="model">{{ model }}</option>
          <option value="custom">Other</option>
        </select>
        
        <input 
          v-if="showCustomModelInput"
          id="model-custom"
          v-model="formData.model"
          placeholder="Enter your vehicle model"
          class="custom-model-input"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="year">Vehicle Year</label>
        <input 
          id="year" 
          type="number" 
          v-model="formData.year"
          placeholder="e.g., 2020" 
          min="1900" 
          max="2026" 
          required 
        />
      </div>
      
      <div class="form-group">
        <label for="phone">Phone Number</label>
        <input 
          id="phone" 
          type="tel" 
          v-model="formData.phone"
          placeholder="e.g., +6591234567" 
          pattern="\+[0-9]{8,15}"
          title="Phone number must start with + followed by 8-15 digits (e.g., +6591234567)"
          required 
        />
      </div>

      <div class="form-group">
        <label for="date">Appointment Date</label>
        <input
          id="date"
          type="date"
          v-model="formData.date"
          :min="minDate"
          :max="maxDate"
          @change="onDateChange"
          required
        />
        <p v-if="isSunday" class="error-text" style="color: red; font-size: 0.85rem; margin-top: 4px;">
          Sundays are not available. Please select another date.
        </p>
      </div>
      
      <div class="form-group">
        <label for="time">Appointment Time</label>
        <select id="time" v-model="formData.time" :disabled="!formData.date || isSunday" required>
          <option value="">Select time</option>
          <option 
            v-for="slot in timeSlots" 
            :key="slot.value" 
            :value="slot.value" 
            :disabled="slot.disabled"
          >
            {{ slot.label }} {{ slot.disabled ? '(Unavailable)' : '' }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="notes">Customer Notes (Include reasons for appointment)</label>
        <textarea 
          id="notes" 
          rows="4" 
          v-model="formData.notes"
          placeholder="Brief description about reason for appointment"
          maxlength="500"
          required
        ></textarea>
      </div>
      
      <button type="submit" class="submit-btn" :disabled="isLoading || isSunday">
        {{ isLoading ? 'Booking...' : 'Confirm Booking' }}
      </button>
    </form>
  </div>
</template>

<script>
import { commonCarData } from '@/data/commonCarData.js';
import { sgDateFromYmd, sgHourNow, sgNow, sgTodayStr } from '@/utils/sgTime.js';

const ALL_SLOTS = [
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '16:00', label: '04:00 PM' },
]

const SATURDAY_SLOTS = ALL_SLOTS.filter(s => ['10:00', '11:00', '12:00'].includes(s.value))

export default {
  name: 'BookingView',
  data() {
    return {
      formData: {
        licensePlate: '',
        make: '',
        model: '',
        year: '',
        phone: '',
        date: '',
        time: '',
        notes: ''
      },
      isLoading: false,
      bookedSlots: [],
      commonCarData: commonCarData,
      makeSelection: '',
      modelSelection: '',
      showCustomMakeInput: false,
      showCustomModelInput: false
    }
  },
  computed: {
    carMakes() {
      return Object.keys(this.commonCarData).sort();
    },
    availableModels() {
      if (!this.formData.make) return [];
      return this.commonCarData[this.formData.make] || [];
    },
    minDate() {
      return sgTodayStr()
    },
    maxDate() {
      const oneMonth = sgNow()
      oneMonth.setMonth(oneMonth.getMonth() + 1)
      return `${oneMonth.getFullYear()}-${String(oneMonth.getMonth() + 1).padStart(2, '0')}-${String(oneMonth.getDate()).padStart(2, '0')}`
    },
    isSunday() {
      if (!this.formData.date) return false
      return sgDateFromYmd(this.formData.date).getUTCDay() === 0
    },
    isSaturday() {
      if (!this.formData.date) return false
      return sgDateFromYmd(this.formData.date).getUTCDay() === 6
    },
    isToday() {
      if (!this.formData.date) return false
      return this.formData.date === sgTodayStr()
    },
    currentHour() {
      return sgHourNow()
    },
    timeSlots() {
      if (!this.formData.date || this.isSunday) return []

      const slots = this.isSaturday ? SATURDAY_SLOTS : ALL_SLOTS

      return slots.map(slot => {
        const slotHour = parseInt(slot.value.split(':')[0])
        const isPast = this.isToday && slotHour <= this.currentHour
        const isBooked = this.bookedSlots.some(b => {
          const dateMatch = b.appointment_date === this.formData.date
          const timeMatch = b.appointment_time.startsWith(slot.value)
          return dateMatch && timeMatch
        })

        return {
          ...slot,
          disabled: isPast || isBooked
        }
      })
    }
  },
  methods: {
    onMakeChange() {
      if (this.makeSelection === 'custom') {
        this.showCustomMakeInput = true;
        this.formData.make = '';
      } else {
        this.showCustomMakeInput = false;
        this.formData.make = this.makeSelection;
      }
      this.formData.model = '';
      this.modelSelection = '';
      this.showCustomModelInput = false;
    },
    onModelSelectChange() {
      if (this.modelSelection === 'custom') {
        this.showCustomModelInput = true;
        this.formData.model = '';
      } else {
        this.showCustomModelInput = false;
        this.formData.model = this.modelSelection;
      }
    },
    async onDateChange() {
      this.formData.time = ''
      if (!this.formData.date || this.isSunday) return
      await this.fetchBookedSlots()
    },
    async fetchBookedSlots() {
      try {
        const response = await fetch('http://localhost:3000/api/customer/bookedSlots')
        const data = await response.json()
        this.bookedSlots = data.data || []
      } catch (err) {
        console.error('Failed to fetch booked slots:', err)
      }
    },
    async handleSubmit() {
      if (this.isSunday) {
        alert('Sundays are not available for bookings.')
        return
      }

      const token = localStorage.getItem('token')

      const payload = {
        appointment_date: this.formData.date,
        appointment_time: this.formData.time,
        customer_notes: this.formData.notes,
        vehicle_license_plate: this.formData.licensePlate,
        vehicle_make: `${this.formData.make} ${this.formData.model}`.trim(),
        vehicle_year: String(this.formData.year),
        phone_number: this.formData.phone
      }

      this.isLoading = true

      try {
        const response = await fetch('http://localhost:3000/api/customer/createAppointment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (!response.ok) {
          const errorMsg = data.message || data.error || 'Unknown error'
          alert(`Booking failed: ${errorMsg}`)
          return
        }

        await this.notifyManagerNewAppointment()

        alert('Booking confirmed!')
        this.resetForm()
        
      } catch (error) {
        console.error('Error:', error)
        alert('Something went wrong. Please try again.')
      } finally {
        this.isLoading = false
      }
    },
    resetForm() {
      this.formData = {
        licensePlate: '',
        make: '',
        model: '',
        year: '',
        phone: '',
        date: '',
        time: '',
        notes: ''
      };
      this.makeSelection = '';
      this.modelSelection = '';
      this.showCustomMakeInput = false;
      this.showCustomModelInput = false;
      this.bookedSlots = [];
    },
    async notifyManagerNewAppointment() {
    try {
      await fetch('http://localhost:3000/api/email/manager-new-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({}),
      })
    } catch (err) {
      console.error('Manager email failed:', err)
    }
  },
  }
}
</script>

<style scoped src="@/assets/BookingForm.css"></style>