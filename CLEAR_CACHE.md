# 如何清除浏览器缓存

## 方法 1：硬刷新（推荐）

**Windows/Linux:**
- 按 `Ctrl + Shift + R` 或 `Ctrl + F5`

**Mac:**
- 按 `Cmd + Shift + R`

---

## 方法 2：清除缓存

### Chrome/Edge:
1. 按 `Ctrl + Shift + Delete`
2. 或打开开发者工具（F12）→ Network 标签
3. 右键点击刷新按钮 → "清空缓存并硬性重新加载"

### Firefox:
1. 按 `Ctrl + Shift + Delete`
2. 或按 `Ctrl + F5`

---

## 方法 3：无痕模式测试

**Chrome/Edge:**
- 按 `Ctrl + Shift + N`

**Firefox:**
- 按 `Ctrl + Shift + P`

在无痕模式下访问 `http://192.168.100.30:3000/posts` 测试

---

## 验证清除成功

清除缓存后，在浏览器控制台（F12）运行：

```javascript
console.log(import.meta.env.VITE_API_URL);
```

应该输出：
```
http://localhost:3001
```

如果看到这个输出，说明新代码已加载，问题应该解决。
