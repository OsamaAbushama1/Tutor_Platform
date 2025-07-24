import React, { useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Payment = () => {
  const [formData, setFormData] = useState({
    studentId: "",
    groupId: "",
    amount: 0,
    paymentMethod: "Vodafone Cash",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/api/payments/create/",
        formData
      );
      alert("تمت العملية بنجاح!");
      console.log(response.data);
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("حدث خطأ أثناء معالجة الدفع.");
    }
  };

  return (
    <div>
      <Header />
      <main>
        <h1>صفحة الدفع</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="studentId"
            placeholder="رقم الطالب"
            value={formData.studentId}
            onChange={handleChange}
          />
          <input
            type="text"
            name="groupId"
            placeholder="رقم المجموعة"
            value={formData.groupId}
            onChange={handleChange}
          />
          <input
            type="number"
            name="amount"
            placeholder="المبلغ"
            value={formData.amount}
            onChange={handleChange}
          />
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
          >
            <option value="Vodafone Cash">Vodafone Cash</option>
            <option value="Fawry">Fawry</option>
          </select>
          <button type="submit">تأكيد الدفع</button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
