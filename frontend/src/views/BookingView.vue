<template>
  <div class="page booking">
    <h1>📅 Book Appointment</h1>
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
          required 
        />
      </div>
      
      <div class="form-group">
        <label for="time">Appointment Time (Need to know how is it schdeuled and how long 1 approx takes, dummy values for now)</label>
        <select id="time" v-model="formData.time" required>
          <option value="">Select time</option>
          <option value="08:00">08:00 AM</option>
          <option value="09:00">09:00 AM</option>
          <option value="10:00">10:00 AM</option>
          <option value="11:00">11:00 AM</option>
          <option value="12:00">12:00 PM</option>
          <option value="13:00">01:00 PM</option>
          <option value="14:00">02:00 PM</option>
          <option value="15:00">03:00 PM</option>
          <option value="16:00">04:00 PM</option>
          <option value="17:00">05:00 PM</option>
          <option value="18:00">06:00 PM</option>
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
      
      <button type="submit" class="submit-btn">Confirm Booking</button>
    </form>
  </div>
</template>

<script>
import { commonCarData } from '../data/commonCarData.js';

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
      if (!this.formData.make) {
        return [];
      }
      return this.commonCarData[this.formData.make] || [];
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
      
      // Reset model when make changes
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
    handleSubmit() {
      // Log to console
      console.log('Form submitted:', this.formData);
      console.log(this.formData)
      // Send to backend API
      // fetch('/api/bookings', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(this.formData)
      // })
      // .then(response => response.json())
      // .then(data => {
      //   console.log('Success:', data);
      //   alert('Booking confirmed!');
      // })
      // .catch(error => {
      //   console.error('Error:', error);
      // });
      
      // Show success message
      alert('Booking confirmed!');
      
      // Optional: Reset form
      this.resetForm();
    },

    validatePhoneNumber(phone) {
      // Remove spaces and dashes
      const cleanedPhone = phone.replace(/[\s\-]/g, '');
      // Must start with +, followed by 8-15 digits
      const phoneRegex = /^\+[0-9]{8,15}$/;
      return phoneRegex.test(cleanedPhone);
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
    }
  }
}
</script>

<style scoped src="@/assets/BookingForm.css"></style>