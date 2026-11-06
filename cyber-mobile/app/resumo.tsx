import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import RpgBar from './components/RpgBar';
import { LineChart, ProgressChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

export default function Resumo() {
  return (
    <ScrollView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginBottom: 10 }}><RpgBar /></View>
      <Text style={styles.title}>Dashboard Analítico</Text>

      {/* Gráfico de Desempenho Físico */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Km Corridos (Últimos 7 dias)</Text>
        <LineChart
          data={{
            labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
            datasets: [{ data: [2.5, 3.2, 0, 4.5, 5.1, 0, 6.2] }]
          }}
          width={screenWidth - 80}
          height={220}
          yAxisSuffix="km"
          withInnerLines={false}
          chartConfig={{
            backgroundColor: "#2C2F33",
            backgroundGradientFrom: "#1A1A1D",
            backgroundGradientTo: "#2C2F33",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 255, 204, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(176, 190, 197, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#00FFCC" }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Progresso de Metas Diárias */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Taxa de Sobrevivência Diária</Text>
        <ProgressChart
          data={{
            labels: ["Água", "Treino", "Dieta"],
            data: [0.85, 1.0, 0.40]
          }}
          width={screenWidth - 80}
          height={200}
          strokeWidth={14}
          radius={32}
          chartConfig={{
            backgroundGradientFrom: "#2C2F33",
            backgroundGradientTo: "#1A1A1D",
            // A CORREÇÃO DEFINITIVA: Isolando o index com segurança máxima
            color: (opacity = 1, index?: number) => {
              const indiceSeguro = index ?? 0;
              const colors = [
                `rgba(0, 191, 255, ${opacity})`, // 0: Água (Azul)
                `rgba(0, 255, 204, ${opacity})`, // 1: Treino (Ciano)
                `rgba(255, 215, 0, ${opacity})`  // 2: Dieta (Ouro)
              ];
              return colors[indiceSeguro] || `rgba(255, 255, 255, ${opacity})`;
            },
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          hideLegend={false}
          style={styles.chart}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1D', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#00FFCC', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#2C2F33', padding: 20, borderRadius: 15, marginBottom: 25, elevation: 5, borderWidth: 1, borderColor: '#455A64' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#B0BEC5', marginBottom: 15, textAlign: 'center' },
  chart: { marginVertical: 8, borderRadius: 16, alignSelf: 'center' }
});