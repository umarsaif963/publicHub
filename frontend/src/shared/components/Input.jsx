export const Input = ({ label, type, placeholder, value, onChange }) => {
    return (
        <>
            <label>{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
        </>
    )
}